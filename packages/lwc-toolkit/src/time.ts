import { Time, isUTCTimestamp, isUTCTimestampNanoseconds, isBusinessDay } from 'lightweight-charts';

const NANOS_PER_MILLI = 1_000_000;

/**
 * Converts any of the library's time representations to milliseconds since the
 * epoch, suitable for `new Date(...)`.
 *
 * Business days and date strings name a calendar day with no time zone, and are
 * built as local midnight rather than UTC midnight. That is deliberate: the
 * result is normally handed to {@link formattedDateAndTime}, which reads local
 * getters, so local construction is what makes a given calendar day display as
 * itself. Building UTC midnight here would show the previous day anywhere west
 * of UTC.
 *
 * @param t - the time to convert.
 * @returns milliseconds since the epoch.
 */
export function convertTime(t: Time): number {
	if (isUTCTimestamp(t)) return t * 1000;
	if (isUTCTimestampNanoseconds(t)) return convertNanosecondsToMilliseconds(t as unknown as bigint);
	// `BusinessDay.month` is 1-based; the `Date` constructor's month is 0-based.
	if (isBusinessDay(t)) return new Date(t.year, t.month - 1, t.day).valueOf();
	if (isISODateTimeString(t)) return parseISODateTimeToMilliseconds(t);
	const [year, month, day] = t.split('-').map(part => parseInt(part, 10));
	return new Date(year, month - 1, day).valueOf();
}

/**
 * Milliseconds since the epoch of a nanosecond timestamp. `Date` cannot hold more than
 * milliseconds, so the sub-millisecond part is truncated.
 */
function convertNanosecondsToMilliseconds(nanos: bigint): number {
	return Number(nanos / BigInt(NANOS_PER_MILLI));
}

function isISODateTimeString(value: string): boolean {
	return value.length > 10 && value[10] === 'T';
}

/**
 * Milliseconds since the epoch of an ISO 8601 date-time string, truncating the fraction to
 * milliseconds. Parsed with `Date.parse`, which for a full UTC date-time is exact to the
 * millisecond (the fraction is truncated, never rounded).
 */
function parseISODateTimeToMilliseconds(value: string): number {
	return Date.parse(value);
}

/**
 * Converts any of the library's time representations to milliseconds since the
 * epoch, building business days and date strings as UTC midnight.
 *
 * Use this rather than {@link convertTime} whenever the result is compared with
 * a `UTCTimestamp` from the chart, or formatted with the `getUTC*` date getters:
 * unlike {@link convertTime} it is independent of the machine's time zone, so
 * the same input always yields the same number.
 *
 * @param t - the time to convert.
 * @returns milliseconds since the epoch.
 */
export function convertTimeUTC(t: Time): number {
	if (isUTCTimestamp(t)) return t * 1000;
	if (isUTCTimestampNanoseconds(t)) return convertNanosecondsToMilliseconds(t as unknown as bigint);
	// `BusinessDay.month` is 1-based; `Date.UTC`'s month is 0-based.
	if (isBusinessDay(t)) return Date.UTC(t.year, t.month - 1, t.day);
	if (isISODateTimeString(t)) return Date.parse(t);
	const [year, month, day] = t.split('-').map(part => parseInt(part, 10));
	return Date.UTC(year, month - 1, day);
}

export function displayTime(time: Time): string {
	if (typeof time == 'string') return time;
	if (isUTCTimestampNanoseconds(time)) {
		return new Date(convertNanosecondsToMilliseconds(time as unknown as bigint)).toLocaleDateString();
	}
	const date = isBusinessDay(time)
		? new Date(time.year, time.month - 1, time.day)
		: new Date((time as number) * 1000);
	return date.toLocaleDateString();
}

export function formattedDateAndTime(timestamp: number | undefined): [string, string] {
	if (!timestamp) return ['', ''];
	const dateObj = new Date(timestamp);

	// Format date string
	const year = dateObj.getFullYear();
	const month = dateObj.toLocaleString('default', { month: 'short' });
	const date = dateObj.getDate().toString().padStart(2, '0');
	const formattedDate = `${date} ${month} ${year}`;

	// Format time string
	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	const formattedTime = `${hours}:${minutes}`;

	return [formattedDate, formattedTime];
}
