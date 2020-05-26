import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { PriceLineOptions } from '../model/price-line-options';
import { SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { Range } from '../model/time-data';

import { SeriesDataItemTypeMap, Time } from './data-consumer';
import { IPriceLine } from './iprice-line';
import { IPriceScaleApi } from './iprice-scale-api';

// actually range might be either exist or not
// but to avoid hard-readable type let's say every part of range is optional
export type BarsInfo =
	Partial<Range<Time>>
	& {
		barsBefore: number;
		barsAfter: number;
	};

/** Interface to be implemented by the object in order to be used as a price formatter */
export interface IPriceFormatter {
	/**
	 * Formatting function
	 * @param price - original price to be formatted
	 * @returns formatted price
	 */
	format(price: BarPrice): string;
}

export interface ISeriesApi<TSeriesType extends SeriesType> {
	/**
	 * Returns current price formatter
	 * @returns interface to the price formatter object that can be used to format prices in the same way as the chart does
	 */
	priceFormatter(): IPriceFormatter;

	/**
	 * Converts specified series price to pixel coordinate according to the series price scale
	 * @param price - input price to be converted
	 * @returns pixel coordinate of the price level on the chart
	 */
	priceToCoordinate(price: number): Coordinate | null;

	/**
	 * Converts specified coordinate to price value according to the series price scale
	 * @param coordinate - input coordinate to be converted
	 * @returns price value of the coordinate on the chart
	 */
	coordinateToPrice(coordinate: number): BarPrice | null;

	/**
	 * Retrieves information about the series' data within a given logical range.
	 * @param range - the logical range to retrieve info for
	 * @returns the bars info for the given logical range: fields `from` and `to` are
	 *   `Logical` values for the first and last bar within the range, and `barsBefore` and
	 *   `barsAfter` count the the available bars outside the given index range. If these
	 *   values are negative, it means that the given range us not fully filled with bars
	 *   on the given side, but bars are missing instead (would show up as a margin if the
	 *   the given index range falls into the viewport).
	 */
	barsInLogicalRange(range: Range<number>): BarsInfo | null;

	/**
	 * Applies new options to the existing series
	 * @param options - any subset of options
	 */
	applyOptions(options: SeriesPartialOptionsMap[TSeriesType]): void;

	/**
	 * Returns currently applied options
	 * @returns full set of currently applied options, including defaults
	 */
	options(): Readonly<SeriesOptionsMap[TSeriesType]>;

	/**
	 * Returns interface of the pri scale the series is currently attached
	 * @returns IPriceScaleApi object to control the price scale
	 */
	priceScale(): IPriceScaleApi;

	/**
	 * Sets or replaces series data
	 * @param data - ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.
	 */
	setData(data: SeriesDataItemTypeMap[TSeriesType][]): void;

	/**
	 * Adds or replaces a new bar
	 * @param bar - a single data item to be added. Time of the new item must be greater or equal to the latest existing time point.
	 * If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.
	 */
	update(bar: SeriesDataItemTypeMap[TSeriesType]): void;

	/**
	 * Sets markers for the series
	 * @param data - array of series markers. This array should be sorted by time. Several markers with same time are allowed.
	 */
	setMarkers(data: SeriesMarker<Time>[]): void;

	/**
	 * Creates a new price line
	 * @param options - any subset of options
	 */
	createPriceLine(options: PriceLineOptions): IPriceLine;

	/**
	 * Removes an existing price line
	 * @param line - to remove
	 */
	removePriceLine(line: IPriceLine): void;
}
