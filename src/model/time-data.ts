import { lowerbound, upperbound } from '../helpers/algorithms';
import { Nominal } from '../helpers/nominal';

import { Coordinate } from './coordinate';
import { RangeImpl } from './range-impl';

/**
 * If your chart displays an intraday interval you should use a UNIX Timestamp.
 *
 * Note that JavaScript Date APIs like `Date.now` return a number of milliseconds but UTCTimestamp expects a number of seconds.
 *
 * Note that to prevent errors, you should cast the numeric type of the time to `UTCTimestamp` type from the package (`value as UTCTimestamp`) in TypeScript code.
 * ```ts
 * const timestamp = 1529899200 as UTCTimestamp; // Literal timestamp representing 2018-06-25T04:00:00.000Z
 * const timestamp2 = (Date.now() / 1000) as UTCTimestamp;
 * ```
 */
export type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;

/**
 * This type is used to specify time for day/week/month (DWM) data.

 * ```js
 * const day = { year: 2019, month: 6, day: 1 }; // June 1, 2019
 * ```
 */
export interface BusinessDay {
	year: number;
	month: number;
	day: number;
}

export interface TimePoint {
	timestamp: UTCTimestamp;
	businessDay?: BusinessDay;
}

export interface TimeScalePoint {
	timeWeight: number;
	time: TimePoint;
}

export interface Range<T> {
	from: T;
	to: T;
}

export type TimePointsRange = Range<TimePoint>;

export type TimePointIndex = Nominal<number, 'TimePointIndex'>;

export type Logical = Nominal<number, 'Logical'>;

export type LogicalRange = Range<Logical>;

export interface TimedValue {
	time: TimePointIndex;
	x: Coordinate;
}

export type SeriesItemsIndexesRange = Range<number>;

function lowerBoundItemsCompare(item: TimedValue, time: TimePointIndex): boolean {
	return item.time < time;
}

function upperBoundItemsCompare(time: TimePointIndex, item: TimedValue): boolean {
	return time < item.time;
}

export function visibleTimedValues(items: TimedValue[], range: RangeImpl<TimePointIndex>, extendedRange: boolean): SeriesItemsIndexesRange {
	const firstBar = range.left();
	const lastBar = range.right();

	const from = lowerbound<TimedValue, TimePointIndex>(items, firstBar, lowerBoundItemsCompare);
	const to = upperbound<TimedValue, TimePointIndex>(items, lastBar, upperBoundItemsCompare);

	if (!extendedRange) {
		return { from, to };
	}

	let extendedFrom = from;
	let extendedTo = to;

	if (from > 0 && from < items.length && items[from].time >= firstBar) {
		extendedFrom = from - 1;
	}

	if (to > 0 && to < items.length && items[to - 1].time <= lastBar) {
		extendedTo = to + 1;
	}

	return { from: extendedFrom, to: extendedTo };
}
