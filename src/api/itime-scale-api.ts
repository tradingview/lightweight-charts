import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { LogicalRange, Range } from '../model/time-data';
import { TimeScaleOptions } from '../model/time-scale';

import { Time } from './data-consumer';

export type TimeRange = Range<Time>;

export type TimeRangeChangeEventHandler = (timeRange: TimeRange | null) => void;
export type LogicalRangeChangeEventHandler = (logicalRange: LogicalRange | null) => void;

/** Interface to chart time scale */
export interface ITimeScaleApi {
	/**
	 * Returns current scroll position of the chart
	 * @returns a distance from the right edge to the latest bar, measured in bars
	 */
	scrollPosition(): number;

	/**
	 * Scrolls the chart to the specified position
	 * @param position - target data position
	 * @param animated - setting this to true makes the chart scrolling smooth and adds animation
	 */
	scrollToPosition(position: number, animated: boolean): void;

	/**
	 * Restores default scroll position of the chart. This process is always animated.
	 */
	scrollToRealTime(): void;

	/**
	 * Returns current visible time range of the chart
	 * @returns visible range or null if the chart has no data at all
	 */
	getVisibleRange(): TimeRange | null;

	/**
	 * Sets visible range of data
	 * @param range - target visible range of data
	 */
	setVisibleRange(range: TimeRange): void;

	/**
	 * Returns the currently visible logical range of data.
	 * @returns visible range or null if the chart has no data at all
	 */
	getVisibleLogicalRange(): LogicalRange | null;

	/**
	 * Sets visible logical range of data.
	 * @param range - target visible logical range of data.
	 */
	setVisibleLogicalRange(range: Range<number>): void;

	/**
	 * Restores default zooming and scroll position of the time scale
	 */
	resetTimeScale(): void;

	/**
	 * Automatically calculates the visible range to fit all data from all series
	 * This is a momentary operation.
	 */
	fitContent(): void;

	/**
	 * Converts a time to local x coordinate.
	 * @param time - time needs to be converted
	 * @returns x coordinate of that time or `null` if no time found on time scale
	 */
	timeToCoordinate(time: Time): Coordinate | null;

	/**
	 * Converts a coordinate to time.
	 * @param x - coordinate needs to be converted
	 * @returns time of a bar that is located on that coordinate or `null` if there are no bars found on that coordinate
	 */
	coordinateToTime(x: number): Time | null;

	/**
	 * Adds a subscription to visible range changes to receive notification about visible range of data changes
	 * @param handler - handler (function) to be called on changing visible data range
	 */
	subscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	/**
	 * Removes a subscription to visible range changes
	 * @param handler - previously subscribed handler
	 */
	unsubscribeVisibleTimeRangeChange(handler: TimeRangeChangeEventHandler): void;

	/**
	 * Adds a subscription to visible index range changes to receive notifications about visible indexes of the data
	 * @param handler - handler (function) to be called when the visible indexes change
	 */
	subscribeVisibleLogicalRangeChange(handler: LogicalRangeChangeEventHandler): void;

	/**
	 * Removes a subscription to visible index range changes
	 * @param handler - previously subscribed handler
	 */
	unsubscribeVisibleLogicalRangeChange(handler: LogicalRangeChangeEventHandler): void;

	/**
	 * Applies new options to the time scale.
	 * @param options - any subset of options
	 */
	applyOptions(options: DeepPartial<TimeScaleOptions>): void;

	/**
	 * Returns current options
	 * @returns currently applied options
	 */
	options(): Readonly<TimeScaleOptions>;
}
