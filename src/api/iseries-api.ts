import { DeepPartial } from '../helpers/strict-type-checks';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { SeriesOptionsMap, SeriesType } from '../model/series-options';

import { SeriesDataItemTypeMap } from './data-consumer';

/** Interface to be implemented by the object in order to be used as a price formatter */
export interface IPriceFormatter {
	/**
	 * Formatting function
	 * @param price - original price to be formatted
	 * @return - formatted price
	 */
	format(price: BarPrice): string;
}

export interface ISeriesApi<TSeriesType extends SeriesType> {
	/**
	 * Returns current price formatter
	 * @return - interface to the price formatter object that can be used to format prices in the same way as the chart does
	 */
	priceFormatter(): IPriceFormatter;

	/** Converts specified series price to pixel coordinate according to the chart price scale
	 * @param price - input price to be converted
	 * @result - pixel coordinate of the price level on the chart
	 */
	priceToCoordinate(price: BarPrice): Coordinate | null;

	/**
	 * Applies new options to the existing series
	 * @param options - any subset of options
	 */
	applyOptions(options: DeepPartial<SeriesOptionsMap[TSeriesType]>): void;

	/**
	 * Returns currently applied options
	 * @return full set of currently applied options, including defaults
	 */
	options(): Readonly<SeriesOptionsMap[TSeriesType]>;

	/**
	 * Sets or replaces series data
	 * @param - ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.
	 */
	setData(data: SeriesDataItemTypeMap[TSeriesType][]): void;

	/**
	 * Adds or replaces a new bar
	 * @param a single data item to be added. Time of the new item must be greater or equal to the latest existing time point.
	 * If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.
	 */
	update(bar: SeriesDataItemTypeMap[TSeriesType]): void;
}
