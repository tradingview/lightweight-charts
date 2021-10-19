import { ensureNever } from '../helpers/assertions';

import { TimePoint } from './time-data';
import { TickMarkType } from './time-scale';

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

	return localDateFromUtc.toLocaleString(locale, formatOptions);
}
