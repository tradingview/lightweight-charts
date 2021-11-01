import { lowerbound, upperbound } from '../helpers/algorithms';
import { Nominal } from '../helpers/nominal';

import { Coordinate } from './coordinate';
import { RangeImpl } from './range-impl';

/**
 * Represents a time a a UNIX timestamp.
 *
 * If your chart displays an intraday interval you should use a UNIX Timestamp.
 *
 * Note that JavaScript Date APIs like `Date.now` return a number of milliseconds but UTCTimestamp expects a number of seconds.
 *
 * Note that to prevent errors, you should cast the numeric type of the time to `UTCTimestamp` type from the package (`value as UTCTimestamp`) in TypeScript code.
 *
 * @example
 * ```ts
 * const timestamp = 1529899200 as UTCTimestamp; // Literal timestamp representing 2018-06-25T04:00:00.000Z
 * const timestamp2 = (Date.now() / 1000) as UTCTimestamp;
 * ```
 */
export type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;

/**
 * Represents a time as a day/week/month.
 *
 * ```js
 * const day = { year: 2019, month: 6, day: 1 }; // June 1, 2019
 * ```
 */
export interface BusinessDay {
	/**
	 * The year.
	 */
	year: number;
	/**
	 * The month.
	 */
	month: number;
	/**
	 * The day.
	 */
	day: number;
}

export interface TimePoint {
	timestamp: UTCTimestamp;
	businessDay?: BusinessDay;
}

export interface TimeScalePoint {
	readonly timeWeight: number;
	readonly time: TimePoint;
}

/**
 * Represents a generic range `from` one value `to` another.
 */
export interface Range<T> {
	/**
	 * The from value. The start of the range.
	 */
	from: T;
	/**
	 * The to value. The end of the range.
	 */
	to: T;
}

export type TimePointsRange = Range<TimePoint>;

export type TimePointIndex = Nominal<number, 'TimePointIndex'>;

/**
 * Represents the to or from `number` in a logical range.
 */
export type Logical = Nominal<number, 'Logical'>;

/**
 * A logical range is an object with 2 properties: `from` and `to`, which are numbers and represent logical indexes on the time scale.
 *
 * The starting point of the time scale's logical range is the first data item among all series.
 * Before that point all indexes are negative, starting from that point - positive.
 *
 * Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.
 *
 * Integer part of the logical index means index of the fully visible bar.
 * Thus, if we have 5.2 as the last visible logical index (`to` field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar.
 * Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.
 */
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
