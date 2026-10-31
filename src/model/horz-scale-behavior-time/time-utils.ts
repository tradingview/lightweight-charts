import { isString } from '../../helpers/strict-type-checks';

import { TimedData } from '../data-layer';
import { InternalHorzScaleItem } from '../ihorz-scale-behavior';
import { BusinessDay, isBusinessDay, isUTCTimestampNanoseconds, Time, TimePoint, UTCTimestamp } from './types';

export type TimeConverter = (time: Time) => InternalHorzScaleItem;

const NANOS_PER_SECOND = 1_000_000_000;
const NANOS_PER_SECOND_BIGINT = 1_000_000_000n;

function toInternalTimePoint(timestamp: number, nanos: number, businessDay?: BusinessDay): InternalHorzScaleItem {
	const point: TimePoint = { timestamp: timestamp as UTCTimestamp };

	if (nanos !== 0) {
		point.nanos = nanos;
	}

	if (businessDay !== undefined) {
		point.businessDay = businessDay;
	}

	return point as unknown as InternalHorzScaleItem;
}

function splitNanoseconds(epochNanos: bigint): { seconds: number; nanos: number } {
	const seconds = epochNanos / NANOS_PER_SECOND_BIGINT;
	const nanos = epochNanos % NANOS_PER_SECOND_BIGINT;

	// timestamps before the epoch keep a positive nanosecond part
	if (nanos < 0n) {
		return { seconds: Number(seconds - 1n), nanos: Number(nanos + NANOS_PER_SECOND_BIGINT) };
	}

	return { seconds: Number(seconds), nanos: Number(nanos) };
}

export function businessDayConverter(time: Time): InternalHorzScaleItem {
	let businessDay = time;
	if (isString(time)) {
		businessDay = stringToBusinessDay(time);
	}
	if (!isBusinessDay(businessDay)) {
		throw new Error('time must be of type BusinessDay');
	}

	const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));
	const seconds = Math.round(date.getTime() / 1000);

	return toInternalTimePoint(seconds, 0, businessDay);
}

export function timestampConverter(time: Time): InternalHorzScaleItem {
	if (!isUTCTimestampNumeric(time)) {
		throw new Error('time must be of type isUTCTimestamp');
	}

	const timestamp = time as number;
	const wholeSeconds = Math.floor(timestamp);
	const nanos = Math.min(NANOS_PER_SECOND - 1, Math.max(0, Math.round((timestamp - wholeSeconds) * NANOS_PER_SECOND)));

	return toInternalTimePoint(timestamp, nanos);
}

export function nanosecondTimestampConverter(time: Time): InternalHorzScaleItem {
	if (!isUTCTimestampNanoseconds(time)) {
		throw new Error('time must be of type isUTCTimestampNanoseconds');
	}

	const epochNanos = time as unknown as bigint;
	const { seconds, nanos } = splitNanoseconds(epochNanos);

	return toInternalTimePoint(seconds, nanos);
}

const isoDateTimeRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:[Zz]|([+-])(\d{2}):?(\d{2}))?$/;

/**
 * ISO 8601 date-time strings are parsed without going through `Date`, so that all nine
 * fractional digits survive. A string without a timezone designator is treated as UTC.
 */
export function isoDateTimeConverter(time: Time): InternalHorzScaleItem {
	const isoString = isString(time) ? time : '';
	const match = isoDateTimeRegex.exec(isoString);
	if (match === null) {
		throw new Error(`Invalid ISO date-time string=${isoString}, expected format=yyyy-mm-ddThh:mm:ss[.sssssssss][Z|±hh:mm]`);
	}

	const year = parseInt(match[1], 10);
	const month = parseInt(match[2], 10);
	const day = parseInt(match[3], 10);
	const hours = parseInt(match[4], 10);
	const minutes = parseInt(match[5], 10);
	const seconds = parseInt(match[6], 10);

	// exactly the number of digits the caller provided: 1 digit means 100ms, 9 digits means 1ns
	const fraction = match[7] ?? '';
	const nanos = fraction.length === 0 ? 0 : parseInt(fraction.padEnd(9, '0'), 10);

	let wholeSeconds = Math.round(Date.UTC(year, month - 1, day, hours, minutes, seconds) / 1000);
	if (match[8] !== undefined) {
		const offsetSeconds = (parseInt(match[9], 10) * 60 + parseInt(match[10], 10)) * 60;
		wholeSeconds += match[8] === '+' ? -offsetSeconds : offsetSeconds;
	}

	return toInternalTimePoint(wholeSeconds, nanos);
}

function isUTCTimestampNumeric(time: Time): boolean {
	return typeof time === 'number';
}

const isoDateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `true` for date-time strings (which carry a time of day), `false` for date-only strings.
 */
export function isISODateTimeString(value: string): boolean {
	return !isoDateOnlyRegex.test(value);
}

export function selectTimeConverter(data: TimedData<Time>[]): TimeConverter | null {
	if (data.length === 0) {
		return null;
	}

	const firstTime = data[0].time;

	if (isUTCTimestampNanoseconds(firstTime)) {
		return nanosecondTimestampConverter;
	}

	if (isString(firstTime) && isISODateTimeString(firstTime)) {
		return isoDateTimeConverter;
	}

	if (isBusinessDay(firstTime) || isString(firstTime)) {
		return businessDayConverter;
	}

	return timestampConverter;
}

const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;

export function convertTime(time: Time): InternalHorzScaleItem {
	if (isUTCTimestampNanoseconds(time)) {
		return nanosecondTimestampConverter(time);
	}

	if (typeof time === 'number') {
		return timestampConverter(time);
	}

	if (isString(time) && isISODateTimeString(time)) {
		return isoDateTimeConverter(time);
	}

	if (!isBusinessDay(time)) {
		return businessDayConverter(stringToBusinessDay(time));
	}

	return businessDayConverter(time);
}

export function stringToBusinessDay(value: string): BusinessDay {
	if (process.env.NODE_ENV === 'development') {
		// in some browsers (I look at your Chrome) the Date constructor may accept invalid date string
		// but parses them in 'implementation specific' way
		// for example 2019-1-1 isn't a valid date string in all browsers, while 2019-01-01 is
		// see https://bugs.chromium.org/p/chromium/issues/detail?id=968939
		// so, we need to be sure that date has valid format to avoid strange behavior and hours of debugging
		// but let's do this in development build only because of perf
		if (!validDateRegex.test(value)) {
			throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
		}
	}

	const d = new Date(value);
	if (isNaN(d.getTime())) {
		throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
	}

	return {
		day: d.getUTCDate(),
		month: d.getUTCMonth() + 1,
		year: d.getUTCFullYear(),
	};
}

export function convertStringToBusinessDay(value: TimedData<Time>): void {
	if (isString(value.time) && !isISODateTimeString(value.time)) {
		value.time = stringToBusinessDay(value.time);
	}
}

export function convertStringsToBusinessDays(data: TimedData<Time>[]): void {
	return data.forEach(convertStringToBusinessDay);
}
