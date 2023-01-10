import { IPriceFormatter } from '../formatters/iprice-formatter';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { MismatchDirection } from '../model/plot-list';
import { CreatePriceLineOptions } from '../model/price-line-options';
import { SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { Range, Time } from '../model/time-data';

import { SeriesDataItemTypeMap } from './data-consumer';
import { IPriceLine } from './iprice-line';
import { IPriceScaleApi } from './iprice-scale-api';

/**
 * Represents a range of bars and the number of bars outside the range.
 */
// actually range might be either exist or not
// but to avoid hard-readable type let's say every part of range is optional
export interface BarsInfo extends Partial<Range<Time>> {
	/**
	 * The number of bars before the start of the range.
	 * Positive value means that there are some bars before (out of logical range from the left) the {@link Range.from} logical index in the series.
	 * Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the {@link Range.from} logical index are some bars.
	 */
	barsBefore: number;

	/**
	 * The number of bars after the end of the range.
	 * Positive value in the `barsAfter` field means that there are some bars after (out of logical range from the right) the {@link Range.to} logical index in the series.
	 * Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the {@link Range.to} logical index are some bars.
	 */
	barsAfter: number;
}

/**
 * Represents the interface for interacting with series.
 */
export interface ISeriesApi<TSeriesType extends SeriesType> {
	/**
	 * Returns current price formatter
	 *
	 * @returns Interface to the price formatter object that can be used to format prices in the same way as the chart does
	 */
	priceFormatter(): IPriceFormatter;

	/**
	 * Converts specified series price to pixel coordinate according to the series price scale
	 *
	 * @param price - Input price to be converted
	 * @returns Pixel coordinate of the price level on the chart
	 */
	priceToCoordinate(price: number): Coordinate | null;

	/**
	 * Converts specified coordinate to price value according to the series price scale
	 *
	 * @param coordinate - Input coordinate to be converted
	 * @returns Price value of the coordinate on the chart
	 */
	coordinateToPrice(coordinate: number): BarPrice | null;

	/**
	 * Returns bars information for the series in the provided [logical range](/time-scale.md#logical-range) or `null`, if no series data has been found in the requested range.
	 * This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.
	 *
	 * @param range - The [logical range](/time-scale.md#logical-range) to retrieve info for.
	 * @returns The bars info for the given logical range.
	 * @example Getting bars info for current visible range
	 * ```js
	 * const barsInfo = series.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());
	 * console.log(barsInfo);
	 * ```
	 * @example Implementing downloading historical data while scrolling
	 * ```js
	 * function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
	 *     const barsInfo = series.barsInLogicalRange(newVisibleLogicalRange);
	 *     // if there less than 50 bars to the left of the visible area
	 *     if (barsInfo !== null && barsInfo.barsBefore < 50) {
	 *         // try to load additional historical data and prepend it to the series data
	 *     }
	 * }
	 *
	 * chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);
	 * ```
	 */
	barsInLogicalRange(range: Range<number>): BarsInfo | null;

	/**
	 * Applies new options to the existing series
	 * You can set options initially when you create series or use the `applyOptions` method of the series to change the existing options.
	 * Note that you can only pass options you want to change.
	 *
	 * @param options - Any subset of options.
	 */
	applyOptions(options: SeriesPartialOptionsMap[TSeriesType]): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns Full set of currently applied options, including defaults
	 */
	options(): Readonly<SeriesOptionsMap[TSeriesType]>;

	/**
	 * Returns interface of the price scale the series is currently attached
	 *
	 * @returns IPriceScaleApi object to control the price scale
	 */
	priceScale(): IPriceScaleApi;

	/**
	 * Sets or replaces series data.
	 *
	 * @param data - Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.
	 * @example Setting data to a line series
	 * ```js
	 * lineSeries.setData([
	 *     { time: '2018-12-12', value: 24.11 },
	 *     { time: '2018-12-13', value: 31.74 },
	 * ]);
	 * ```
	 * @example Setting data to a bars (or candlestick) series
	 * ```js
	 * barSeries.setData([
	 *     { time: '2018-12-19', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },
	 *     { time: '2018-12-20', open: 145.72, high: 147.99, low: 100.11, close: 108.19 },
	 * ]);
	 * ```
	 */
	setData(data: SeriesDataItemTypeMap[TSeriesType][]): void;

	/**
	 * Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).
	 *
	 * @param bar - A single data item to be added. Time of the new item must be greater or equal to the latest existing time point.
	 * If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.
	 * @example Updating line series data
	 * ```js
	 * lineSeries.update({
	 *     time: '2018-12-12',
	 *     value: 24.11,
	 * });
	 * ```
	 * @example Updating bar (or candlestick) series data
	 * ```js
	 * barSeries.update({
	 *     time: '2018-12-19',
	 *     open: 141.77,
	 *     high: 170.39,
	 *     low: 120.25,
	 *     close: 145.72,
	 * });
	 * ```
	 */
	update(bar: SeriesDataItemTypeMap[TSeriesType]): void;

	/**
	 * Returns a bar data by provided logical index.
	 *
	 * @param logicalIndex - Logical index
	 * @param mismatchDirection - Search direction if no data found at provided logical index.
	 * @returns Original data item provided via setData or update methods.
	 * @example
	 * ```js
	 * const originalData = series.dataByIndex(10, LightweightCharts.MismatchDirection.NearestLeft);
	 * ```
	 */
	dataByIndex(logicalIndex: number, mismatchDirection?: MismatchDirection): SeriesDataItemTypeMap[TSeriesType] | null;

	/**
	 * Allows to set/replace all existing series markers with new ones.
	 *
	 * @param data - An array of series markers. This array should be sorted by time. Several markers with same time are allowed.
	 * @example
	 * ```js
	 * series.setMarkers([
	 *     {
	 *         time: '2019-04-09',
	 *         position: 'aboveBar',
	 *         color: 'black',
	 *         shape: 'arrowDown',
	 *     },
	 *     {
	 *         time: '2019-05-31',
	 *         position: 'belowBar',
	 *         color: 'red',
	 *         shape: 'arrowUp',
	 *         id: 'id3',
	 *     },
	 *     {
	 *         time: '2019-05-31',
	 *         position: 'belowBar',
	 *         color: 'orange',
	 *         shape: 'arrowUp',
	 *         id: 'id4',
	 *         text: 'example',
	 *         size: 2,
	 *     },
	 * ]);
	 *
	 * chart.subscribeCrosshairMove(param => {
	 *     console.log(param.hoveredObjectId);
	 * });
	 *
	 * chart.subscribeClick(param => {
	 *     console.log(param.hoveredObjectId);
	 * });
	 * ```
	 */
	setMarkers(data: SeriesMarker<Time>[]): void;

	/**
	 * Returns an array of series markers.
	 */
	markers(): SeriesMarker<Time>[];

	/**
	 * Creates a new price line
	 *
	 * @param options - Any subset of options, however `price` is required.
	 * @example
	 * ```js
	 * const priceLine = series.createPriceLine({
	 *     price: 80.0,
	 *     color: 'green',
	 *     lineWidth: 2,
	 *     lineStyle: LightweightCharts.LineStyle.Dotted,
	 *     axisLabelVisible: true,
	 *     title: 'P/L 500',
	 * });
	 * ```
	 */
	createPriceLine(options: CreatePriceLineOptions): IPriceLine;

	/**
	 * Removes the price line that was created before.
	 *
	 * @param line - A line to remove.
	 * @example
	 * ```js
	 * const priceLine = series.createPriceLine({ price: 80.0 });
	 * series.removePriceLine(priceLine);
	 * ```
	 */
	removePriceLine(line: IPriceLine): void;

	/**
	 * Return current series type.
	 *
	 * @returns Type of the series.
	 * @example
	 * ```js
	 * const lineSeries = chart.addLineSeries();
	 * console.log(lineSeries.seriesType()); // "Line"
	 *
	 * const candlestickSeries = chart.addCandlestickSeries();
	 * console.log(candlestickSeries.seriesType()); // "Candlestick"
	 * ```
	 */
	seriesType(): TSeriesType;
}
