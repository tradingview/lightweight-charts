import { DeepPartial } from '../helpers/strict-type-checks';

import { TimePointIndexRange } from '../model/time-data';
import { TimeScaleOptions } from '../model/time-scale';

import { Time } from './data-consumer';

export interface TimeRange {
	from: Time;
	to: Time;
}

export type TimeRangeChangeEventHandler = (timeRange: TimeRange | null) => void;

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
	 * @returns - visible range or null if the chart has no data at all
	 */
	getVisibleRange(): TimeRange | null;

	/**
	 * Sets visible range of data
	 * @param range - target visible range of data
	 */
	setVisibleRange(range: TimeRange): void;

	/**
	 * Returns the currently visible index range of data.
	 * @returns - visible range or null if the chart has no data at all
	 */
	getVisibleIndexRange(): TimePointIndexRange | null;

	/**
	 * Sets visible index range of data.
	 * @param range - target visible index range of data.
	 */
	setVisibleIndexRange(range: TimePointIndexRange): void;

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
	 * Applies new options to the time scale.
	 * @param options - any subset of options
	 */
	applyOptions(options: DeepPartial<TimeScaleOptions>): void;

	/**
	 * Returns current options
	 * @returns - currently applied options
	 */
	options(): Readonly<TimeScaleOptions>;
}
