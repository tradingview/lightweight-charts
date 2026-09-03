import { Time, isUTCTimestamp, isBusinessDay } from 'lightweight-charts';

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
	// `BusinessDay.month` is 1-based; the `Date` constructor's month is 0-based.
	if (isBusinessDay(t)) return new Date(t.year, t.month - 1, t.day).valueOf();
	const [year, month, day] = t.split('-').map(part => parseInt(part, 10));
	return new Date(year, month - 1, day).valueOf();
}

export function displayTime(time: Time): string {
	if (typeof time == 'string') return time;
	const date = isBusinessDay(time)
		? new Date(time.year, time.month - 1, time.day)
		: new Date(time * 1000);
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
