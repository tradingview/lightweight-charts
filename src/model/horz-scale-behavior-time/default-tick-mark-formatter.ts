import { ensureNever } from '../../helpers/assertions';

import { formatNanosFraction, TickMarkType, TimePoint } from './types';

function fractionalDigitsForTickMarkType(tickMarkType: TickMarkType): number {
	switch (tickMarkType) {
		case TickMarkType.TimeWithMilliseconds:
			return 3;

		case TickMarkType.TimeWithMicroseconds:
			return 6;

		case TickMarkType.TimeWithNanoseconds:
			return 9;

		default:
			return 0;
	}
}

export function defaultTickMarkFormatter(timePoint: TimePoint, tickMarkType: TickMarkType, locale: string): string {
	const formatOptions: Intl.DateTimeFormatOptions = {};

	switch (tickMarkType) {
		case TickMarkType.Year:
			formatOptions.year = 'numeric';
			break;

		case TickMarkType.Month:
			formatOptions.month = 'short';
			break;

		case TickMarkType.DayOfMonth:
			formatOptions.day = 'numeric';
			break;

		case TickMarkType.Time:
			formatOptions.hour12 = false;
			formatOptions.hour = '2-digit';
			formatOptions.minute = '2-digit';
			break;

		case TickMarkType.TimeWithSeconds:
		case TickMarkType.TimeWithMilliseconds:
		case TickMarkType.TimeWithMicroseconds:
		case TickMarkType.TimeWithNanoseconds:
			formatOptions.hour12 = false;
			formatOptions.hour = '2-digit';
			formatOptions.minute = '2-digit';
			formatOptions.second = '2-digit';
			break;

		default:
			ensureNever(tickMarkType);
	}

	const date = timePoint.businessDay === undefined
		? new Date(timePoint.timestamp * 1000)
		: new Date(Date.UTC(timePoint.businessDay.year, timePoint.businessDay.month - 1, timePoint.businessDay.day));

	// from given date we should use only as UTC date or timestamp
	// but to format as locale date we can convert UTC date to local date
	const localDateFromUtc = new Date(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		date.getUTCHours(),
		date.getUTCMinutes(),
		date.getUTCSeconds(),
		date.getUTCMilliseconds()
	);

	const formatted = localDateFromUtc.toLocaleString(locale, formatOptions);

	// `Intl` supports at most three fractional digits, so microseconds and nanoseconds are
	// appended from the nanosecond value itself.
	const fraction = formatNanosFraction(timePoint.nanos, fractionalDigitsForTickMarkType(tickMarkType));

	return fraction.length === 0 ? formatted : `${formatted}.${fraction}`;
}
