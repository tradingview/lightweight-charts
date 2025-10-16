import { IPriceFormatter } from '../formatters/iprice-formatter';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { SeriesDataItemTypeMap } from '../model/data-consumer';
import { Time } from '../model/horz-scale-behavior-time/types';
import { LastValueDataResult } from '../model/iseries';
import { MismatchDirection } from '../model/plot-list';
import { CreatePriceLineOptions } from '../model/price-line-options';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';
import { IRange } from '../model/time-data';

import { IPaneApi } from './ipane-api';
import { IPriceLine } from './iprice-line';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesPrimitive } from './iseries-primitive-api';

/**
 * The extent of the data change.
 */
export type DataChangedScope = 'full' | 'update';

/**
 * A custom function use to handle data changed events.
 */
export type DataChangedHandler = (scope: DataChangedScope) => void;

/**
 * Represents a range of bars and the number of bars outside the range.
 */
// actually range might be either exist or not
// but to avoid hard-readable type let's say every part of range is optional
export interface BarsInfo<HorzScaleItem> extends Partial<IRange<HorzScaleItem>> {
	/**
	 * The number of bars before the start of the range.
	 * Positive value means that there are some bars before (out of logical range from the left) the {@link IRange.from} logical index in the series.
	 * Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the {@link IRange.from} logical index are some bars.
	 */
	barsBefore: number;

	/**
	 * The number of bars after the end of the range.
	 * Positive value in the `barsAfter` field means that there are some bars after (out of logical range from the right) the {@link IRange.to} logical index in the series.
	 * Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the {@link IRange.to} logical index are some bars.
	 */
	barsAfter: number;
}

/**
 * Represents the interface for interacting with series.
 */
export interface ISeriesApi<
	TSeriesType extends SeriesType,
	HorzScaleItem = Time,
	TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType],
	TOptions = SeriesOptionsMap[TSeriesType],
	TPartialOptions = SeriesPartialOptionsMap[TSeriesType],
	> {
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
	barsInLogicalRange(range: IRange<number>): BarsInfo<HorzScaleItem> | null;

	/**
	 * Applies new options to the existing series
	 * You can set options initially when you create series or use the `applyOptions` method of the series to change the existing options.
	 * Note that you can only pass options you want to change.
	 *
	 * @param options - Any subset of options.
	 */
	applyOptions(options: TPartialOptions): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns Full set of currently applied options, including defaults
	 */
	options(): Readonly<TOptions>;

	/**
	 * Returns the API interface for controlling the price scale that this series is currently attached to.
	 *
	 * @returns IPriceScaleApi An interface for controlling the price scale (axis component) currently used by this series
	 *
	 * @remarks
	 * Important: The returned PriceScaleApi is bound to the specific price scale (by ID and pane) that the series
	 * is using at the time this method is called. If you later move the series to a different pane or attach it
	 * to a different price scale (e.g., from 'right' to 'left'), the previously returned PriceScaleApi will NOT
	 * follow the series. It will continue to control the original price scale it was created for.
	 *
	 * To control the new price scale after moving a series, you must call this method again to get a fresh
	 * PriceScaleApi instance for the current price scale.
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
	setData(data: TData[]): void;

	/**
	 * Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).
	 *
	 * @param bar - A single data item to be added. Time of the new item must be greater or equal to the latest existing time point.
	 * If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.
	 * @param historicalUpdate - If true, allows updating an existing data point that is not the latest bar. Default is false.
	 * Updating older data using `historicalUpdate` will be slower than updating the most recent data point.
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
	update(bar: TData, historicalUpdate?: boolean): void;

	/**
	 * Removes one or more data items from the end of the series.
	 *
	 * @param count - The number of data items to remove.
	 * @returns The removed data items.
	 * @example Removing one data item from a series
	 * ```js
	 * const removedData = lineSeries.pop(1);
	 * console.log(removedData);
	 * ```
	 */
	pop(count: number): TData[];

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
	dataByIndex(logicalIndex: number, mismatchDirection?: MismatchDirection): TData | null;

	/**
	 * Returns all the bar data for the series.
	 *
	 * @returns Original data items provided via setData or update methods.
	 * @example
	 * ```js
	 * const originalData = series.data();
	 * ```
	 */
	data(): readonly TData[];

	/**
	 * Subscribe to the data changed event. This event is fired whenever the `update` or `setData` method is evoked
	 * on the series.
	 *
	 * @param handler - Handler to be called on a data changed event.
	 * @example
	 * ```js
	 * function myHandler() {
	 *     const data = series.data();
	 *     console.log(`The data has changed. New Data length: ${data.length}`);
	 * }
	 *
	 * series.subscribeDataChanged(myHandler);
	 * ```
	 */
	subscribeDataChanged(handler: DataChangedHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeDataChanged}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeDataChanged(myHandler);
	 * ```
	 */
	unsubscribeDataChanged(handler: DataChangedHandler): void;

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
	 * Returns an array of price lines.
	 */
	priceLines(): IPriceLine[];

	/**
	 * Return current series type.
	 *
	 * @returns Type of the series.
	 * @example
	 * ```js
	 * const lineSeries = chart.addSeries(LineSeries);
	 * console.log(lineSeries.seriesType()); // "Line"
	 *
	 * const candlestickSeries = chart.addCandlestickSeries();
	 * console.log(candlestickSeries.seriesType()); // "Candlestick"
	 * ```
	 */
	seriesType(): TSeriesType;

	/**
	 * Return the last value data of the series.
	 *
	 * @param globalLast - If false, get the last value in the current visible range. Otherwise, fetch the absolute last value
	 * @returns The last value data of the series.
	 * @example
	 * ```js
	 * const lineSeries = chart.addSeries(LineSeries);
	 * console.log(lineSeries.lastValueData(true)); // { noData: false, price: 24.11, color: '#000000' }
	 *
	 * const candlestickSeries = chart.addCandlestickSeries();
	 * console.log(candlestickSeries.lastValueData(false)); // { noData: false, price: 145.72, color: '#000000' }
	 * ```
	 */
	lastValueData(globalLast: boolean): LastValueDataResult;

	/**
	 * Attaches additional drawing primitive to the series
	 *
	 * @param primitive - any implementation of ISeriesPrimitive interface
	 */
	attachPrimitive(primitive: ISeriesPrimitive<HorzScaleItem>): void;

	/**
	 * Detaches additional drawing primitive from the series
	 *
	 * @param primitive - implementation of ISeriesPrimitive interface attached before
	 * Does nothing if specified primitive was not attached
	 */
	detachPrimitive(primitive: ISeriesPrimitive<HorzScaleItem>): void;

	/**
	 * Move the series to another pane.
	 *
	 * If the pane with the specified index does not exist, the pane will be created.
	 *
	 * @param paneIndex - The index of the pane. Should be a number between 0 and the total number of panes.
	 */
	moveToPane(paneIndex: number): void;

	/**
	 * Gets the zero-based index of this series within the list of all series on the current pane.
	 *
	 * @returns The current index of the series in the pane's series collection.
	 */
	seriesOrder(): number;

	/**
	 * Sets the zero-based index of this series within the pane's series collection, thereby adjusting its rendering order.
	 *
	 * Note:
	 * - The chart may automatically recalculate this index after operations such as removing other series or moving this series to a different pane.
	 * - If the provided index is less than 0, equal to, or greater than the number of series, it will be clamped to a valid range.
	 * - Price scales derive their formatters from the series with the lowest index; changing the order may affect the price scale's formatting
	 *
	 * @param order - The desired zero-based index to set for this series within the pane.
	 */
	setSeriesOrder(order: number): void;

	/**
	 * Returns the pane to which the series is currently attached.
	 *
	 * @returns Pane API object to control the pane
	 */
	getPane(): IPaneApi<HorzScaleItem>;
}
