import { ensureNever } from '../../helpers/assertions';

import { TickMarkType, TimePoint } from './types';

export function defaultTickMarkFormatter(timePoint: TimePoint, tickMarkType: TickMarkType, locale: string): string {
	// the given time is a UTC date or timestamp, so format it in UTC rather than
	// shifting it to a local date, which can land in a daylight saving time gap
	const formatOptions: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };

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

	return date.toLocaleString(locale, formatOptions);
}
