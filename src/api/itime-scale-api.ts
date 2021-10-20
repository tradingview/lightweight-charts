import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { Logical, LogicalRange, Range } from '../model/time-data';
import { TimeScaleOptions } from '../model/time-scale';

import { Time } from './data-consumer';

/**
 * Represents a {@link Time} range.
 */
export type TimeRange = Range<Time>;

/**
 * A custom function used to handle changes to the time scale's time range.
 */
export type TimeRangeChangeEventHandler = (timeRange: TimeRange | null) => void;
/**
 * A custom function used to handle changes to the time scale's logical range.
 */
export type LogicalRangeChangeEventHandler = (logicalRange: LogicalRange | null) => void;
/**
 * A custom function used to handle changes to the time scale's size.
 */
export type SizeChangeEventHandler = (width: number, height: number) => void;

/** Interface to chart time scale */
export interface ITimeScaleApi {
	/**
	 * Return the distance from the right edge of the time scale to the lastest bar of the series measured in bars.
	 *
	 * @returns {number} a distance from the right edge to the latest bar, measured in bars.
	 */
	scrollPosition(): number;

	/**
	 * Scrolls the chart to the specified position.
	 *
	 * @param position - target data position
	 * @param animated - setting this to true makes the chart scrolling smooth and adds animation
	 */
	scrollToPosition(position: number, animated: boolean): void;

	/**
	 * Restores default scroll position of the chart. This process is always animated.
	 */
	scrollToRealTime(): void;

	/**
	 * Returns current visible time range of the chart.
	 *
	 * @returns visible range or null if the chart has no data at all.
	 */
	getVisibleRange(): TimeRange | null;

	/**
	 * Sets visible range of data.
	 *
	 * @param range - target visible range of data.
	 * @example
	 * ```js
	 * chart.timeScale().setVisibleRange({
	 *     from: (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))).getTime() / 1000,
	 *     to: (new Date(Date.UTC(2018, 1, 1, 0, 0, 0, 0))).getTime() / 1000,
	 * });
	 * ```
	 */
	setVisibleRange(range: TimeRange): void;

	/**
	 * Returns the current visible [logical range](#logical-range) of the chart as an object with the first and last time points of the logical range, or returns `null` if the chart has no data.
	 *
	 * @returns visible range or null if the chart has no data at all.
	 */
	getVisibleLogicalRange(): LogicalRange | null;

	/**
	 * Sets visible logical range of data.
	 *
	 * @param range - target visible logical range of data.
	 * @example
	 * ```js
	 * chart.timeScale().setVisibleLogicalRange({ from: 0, to: Date.now() / 1000 });
	 * ```
	 */
	setVisibleLogicalRange(range: Range<number>): void;

	/**
	 * Restores default zoom level and scroll position of the time scale.
	 */
	resetTimeScale(): void;

	/**
	 * Automatically calculates the visible range to fit all data from all series.
	 */
	fitContent(): void;

	/**
	 * Converts a logical index to local x coordinate.
	 *
	 * @param logical - logical index needs to be converted
	 * @returns x coordinate of that time or `null` if the chart doesn't have data
	 */
	logicalToCoordinate(logical: Logical): Coordinate | null;

	/**
	 * Converts a coordinate to logical index.
	 *
	 * @param x - coordinate needs to be converted
	 * @returns logical index that is located on that coordinate or `null` if the chart doesn't have data
	 */
	coordinateToLogical(x: number): Logical | null;

	/**
	 * Converts a time to local x coordinate.
	 *
	 * @param time - time needs to be converted
	 * @returns x coordinate of that time or `null` if no time found on time scale
	 */
	timeToCoordinate(time: Time): Coordinate | null;

	/**
	 * Converts a coordinate to time.
	 *
	 * @param x - coordinate needs to be converted.
	 * @returns time of a bar that is located on that coordinate or `null` if there are no bars found on that coordinate.
	 */
	coordinateToTime(x: number): Time | null;

	/**
	 * Returns a width of the time scale.
	 */
	width(): number;

	/**
	 * Returns a height of the time scale.
	 */
	height(): number;

	/**
	 * Subscribe to the visible time range change events.
	 *
	 * The argument passed to the handler function is an object with `from` and `to` properties of type {@link Time}, or `null` if there is no visible data.
	 *
	 * @param handler - handler (function) to be called when the visible indexes change.
	 * @example
	 * ```js
	 * function myVisibleTimeRangeChangeHandler(newVisibleTimeRange) {
	 *     if (newVisibleTimeRange === null) {
	 *         // handle null
	 *     }
	 *
	 *     // handle new logical range
	 * }
	 *
	 * chart.timeScale().subscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
	 * ```
	 */
	subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeVisibleTimeRangeChange}.
	 *
	 * @param handler - previously subscribed handler
	 * @example
	 * ```js
	 * chart.timeScale().unsubscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
	 * ```
	 */
	unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	/**
	 * Subscribe to the visible logical range change events.
	 *
	 * The argument passed to the handler function is an object with `from` and `to` properties of type `number`, or `null` if there is no visible data.
	 *
	 * @param handler - handler (function) to be called when the visible indexes change.
	 * @example
	 * ```js
	 * function myVisibleLogicalRangeChangeHandler(newVisibleLogicalRange) {
	 *     if (newVisibleLogicalRange === null) {
	 *         // handle null
	 *     }
	 *
	 *     // handle new logical range
	 * }
	 *
	 * chart.timeScale().subscribeVisibleLogicalRangeChange(myVisibleLogicalRangeChangeHandler);
	 * ```
	 */
	subscribeVisibleLogicalRangeChange(handler: LogicalRangeChangeEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeVisibleLogicalRangeChange}.
	 *
	 * @param handler - previously subscribed handler
	 * @example
	 * ```js
	 * chart.timeScale().unsubscribeVisibleLogicalRangeChange(myVisibleLogicalRangeChangeHandler);
	 * ```
	 */
	unsubscribeVisibleLogicalRangeChange(handler: LogicalRangeChangeEventHandler): void;

	/**
	 * Adds a subscription to time scale size changes
	 *
	 * @param handler - handler (function) to be called when the time scale size changes
	 */
	subscribeSizeChange(handler: SizeChangeEventHandler): void;

	/**
	 * Removes a subscription to time scale size changes
	 *
	 * @param handler - previously subscribed handler
	 */
	unsubscribeSizeChange(handler: SizeChangeEventHandler): void;

	/**
	 * Applies new options to the time scale.
	 *
	 * @param options - any subset of options
	 */
	applyOptions(options: DeepPartial<TimeScaleOptions>): void;

	/**
	 * Returns current options
	 *
	 * @returns currently applied options
	 */
	options(): Readonly<TimeScaleOptions>;
}
