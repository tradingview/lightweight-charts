import { lowerbound, upperbound } from '../helpers/algorithms';
import { Nominal } from '../helpers/nominal';

import { Coordinate } from './coordinate';
import { RangeImpl } from './range-impl';

/**
 * Represents a time as a UNIX timestamp.
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
 * Represents a time as a day/month/year.
 *
 * @example
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

/**
 * The Time type is used to represent the time of data items.
 *
 * Values can be a {@link UTCTimestamp}, a {@link BusinessDay}, or a business day string in ISO format.
 *
 * @example
 * ```js
 * const timestamp = 1529899200; // Literal timestamp representing 2018-06-25T04:00:00.000Z
 * const businessDay = { year: 2019, month: 6, day: 1 }; // June 1, 2019
 * const businessDayString = '2021-02-03'; // Business day string literal
 * ```
 */
export type Time = UTCTimestamp | BusinessDay | string;

export type OriginalTime = Nominal<unknown, 'OriginalTime'>;

export interface TimePoint {
	timestamp: UTCTimestamp;
	businessDay?: BusinessDay;
}

/**
 * Describes a weight of tick mark, i.e. a part of a time that changed since previous time.
 * Note that you can use any timezone to calculate this value, it is unnecessary to use UTC.
 *
 * @example Between 2020-01-01 and 2020-01-02 there is a day of difference, i.e. for 2020-01-02 weight would be a day.
 * @example Between 2020-01-01 and 2020-02-02 there is a month of difference, i.e. for 2020-02-02 weight would be a month.
 */
export const enum TickMarkWeight {
	LessThanSecond = 0,
	Second = 10,
	Minute1 = 20,
	Minute5 = 21,
	Minute30 = 22,
	Hour1 = 30,
	Hour3 = 31,
	Hour6 = 32,
	Hour12 = 33,
	Day = 50,
	Month = 60,
	Year = 70,
}

export interface TimeScalePoint {
	readonly timeWeight: TickMarkWeight;
	readonly time: TimePoint;
	readonly originalTime: OriginalTime;
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
 * Represents the `to` or `from` number in a logical range.
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
