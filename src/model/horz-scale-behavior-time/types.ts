import { fractionalDigitsForNanos } from '../../helpers/nanos';
import { Nominal } from '../../helpers/nominal';
import { isNumber, isString } from '../../helpers/strict-type-checks';

export { fractionalDigitsForNanos };

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
 * Represents a time as a UNIX timestamp in **nanoseconds**.
 *
 * A `number` cannot hold epoch nanoseconds (a double is exact only up to 2^53 ≈ 9.0e15, while
 * epoch nanoseconds need ~61 bits), so nanosecond timestamps must use a `bigint`.
 *
 * @example
 * ```ts
 * const nanosecondTimestamp = 1700000000123456789n as UTCTimestampNanoseconds;
 * ```
 */
export type UTCTimestampNanoseconds = Nominal<bigint, 'UTCTimestampNanoseconds'>;

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
 * Values can be a {@link UTCTimestamp} (seconds, optionally fractional), a
 * {@link UTCTimestampNanoseconds} (nanoseconds, exact), a {@link BusinessDay}, a business day
 * string in ISO format (`yyyy-mm-dd`), or an ISO 8601 date-time string with 1 to 9 fractional
 * digits (`2024-05-01T12:00:00.123456789Z`).
 *
 * @example
 * ```js
 * const timestamp = 1529899200; // Literal timestamp representing 2018-06-25T04:00:00.000Z
 * const businessDay = { year: 2019, month: 6, day: 1 }; // June 1, 2019
 * const businessDayString = '2021-02-03'; // Business day string literal
 * const nanosecondTimestamp = 1700000000123456789n; // epoch nanoseconds, exact
 * const isoDateTime = '2024-05-01T12:00:00.123456789Z'; // also exact
 * ```
 */
export type Time = UTCTimestamp | UTCTimestampNanoseconds | BusinessDay | string;

export interface TimePoint {
	/** Whole seconds since the epoch. Fractional seconds are possible for {@link UTCTimestamp} times. */
	timestamp: UTCTimestamp;
	/** Nanosecond part, `0..999999999`. Present only for sub-second precision times. */
	nanos?: number;
	businessDay?: BusinessDay;
}

/**
 * Check if a time value is a business day object.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link BusinessDay} object, false otherwise.
 */
export function isBusinessDay(time: Time): time is BusinessDay {
	return !isNumber(time) && !isString(time) && typeof time !== 'bigint';
}

/**
 * Check if a time value is a nanosecond UNIX timestamp.
 *
 * @param time - The time to check.
 * @returns `true` if the time is a {@link UTCTimestampNanoseconds}, false otherwise.
 */
export function isUTCTimestampNanoseconds(time: Time): time is UTCTimestampNanoseconds {
	return typeof time === 'bigint';
}

/**
 * Check if a time value is a UTC timestamp number.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link UTCTimestamp} number, false otherwise.
 */
export function isUTCTimestamp(time: Time): time is UTCTimestamp {
	return isNumber(time);
}

/**
 * Represents the type of a tick mark on the time axis.
 */
export const enum TickMarkType {
	/**
	 * The start of the year (e.g. it's the first tick mark in a year).
	 */
	Year,
	/**
	 * The start of the month (e.g. it's the first tick mark in a month).
	 */
	Month,
	/**
	 * A day of the month.
	 */
	DayOfMonth,
	/**
	 * A time without seconds.
	 */
	Time,
	/**
	 * A time with seconds.
	 */
	TimeWithSeconds,
	/**
	 * A time with seconds and milliseconds.
	 */
	TimeWithMilliseconds,
	/**
	 * A time with seconds and microseconds.
	 */
	TimeWithMicroseconds,
	/**
	 * A time with seconds and nanoseconds.
	 */
	TimeWithNanoseconds,
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
	/**
	 * The nanosecond changed (sub-microsecond difference).
	 */
	Nano = 1,
	/**
	 * The microsecond changed (sub-millisecond difference).
	 */
	Micro = 2,
	/**
	 * The millisecond changed (sub-second difference).
	 */
	Milli = 3,
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

/**
 * Number of fractional second digits a tick mark of this weight renders.
 * Returns 0 for weights which do not display a fractional part.
 */
export function fractionalDigitsForWeight(weight: number): number {
	// The weight is a nominal number at the call site; the tick mark weights are
	// the only values it takes.
	const tickMarkWeight = weight as TickMarkWeight;
	switch (tickMarkWeight) {
		case TickMarkWeight.Milli:
			return 3;

		case TickMarkWeight.Micro:
			return 6;

		case TickMarkWeight.Nano:
			return 9;

		default:
			return 0;
	}
}

/**
 * Formats the fractional part of a timestamp (without the leading dot), padded to `digits`.
 */
export function formatNanosFraction(nanos: number | undefined, digits: number): string {
	if (digits === 0 || nanos === undefined || nanos === 0) {
		return '';
	}

	const divisor = Math.pow(10, 9 - digits);
	return String(Math.floor(nanos / divisor)).padStart(digits, '0');
}
