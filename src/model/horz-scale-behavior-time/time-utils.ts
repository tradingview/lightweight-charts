
import { isString } from '../../helpers/strict-type-checks';

import { TimedData } from '../data-layer';
import { InternalHorzScaleItem } from '../ihorz-scale-behavior';
import { BusinessDay, isBusinessDay, isUTCTimestamp, Time, UTCTimestamp } from './types';

export type TimeConverter = (time: Time) => InternalHorzScaleItem;

export function businessDayConverter(time: Time): InternalHorzScaleItem {
	let businessDay = time;
	if (isString(time)) {
		businessDay = stringToBusinessDay(time);
	}
	if (!isBusinessDay(businessDay)) {
		throw new Error('time must be of type BusinessDay');
	}

	const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));

	return {
		timestamp: Math.round(date.getTime() / 1000) as UTCTimestamp,
		businessDay,
	} as unknown as InternalHorzScaleItem;
}

export function timestampConverter(time: Time): InternalHorzScaleItem {
	if (!isUTCTimestamp(time)) {
		throw new Error('time must be of type isUTCTimestamp');
	}
	return {
		timestamp: time,
	} as unknown as InternalHorzScaleItem;
}

export function selectTimeConverter(data: TimedData<Time>[]): TimeConverter | null {
	if (data.length === 0) {
		return null;
	}
	if (isBusinessDay(data[0].time) || isString(data[0].time)) {
		return businessDayConverter;
	}
	return timestampConverter;
}

const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;
const nonPaddedDateRegex = /^(\d\d\d\d)-(\d\d?)-(\d\d?)$/;

function padDatePart(value: string): string {
	return value.length === 1 ? `0${value}` : value;
}

export function convertTime(time: Time): InternalHorzScaleItem {
	if (isUTCTimestamp(time)) {
		return timestampConverter(time);
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
		// for example 2019-1-1 isn't the same as 2019-01-01 (for Chrome both are 'valid' date strings)
		// see https://bugs.chromium.org/p/chromium/issues/detail?id=968939
		// so, we need to be sure that date has valid format to avoid strange behavior and hours of debugging
		// but let's do this in development build only because of perf
		if (!validDateRegex.test(value)) {
			throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
		}
	}

	// the Date constructor parses non-padded strings like 2019-1-1 as local time rather than UTC,
	// which shifts the date back by one day for timezones ahead of UTC, so pad them to yyyy-mm-dd first
	let isoValue = value;
	if (value.length !== 10) {
		const match = nonPaddedDateRegex.exec(value);
		if (match !== null) {
			isoValue = `${match[1]}-${padDatePart(match[2])}-${padDatePart(match[3])}`;
		}
	}

	const d = new Date(isoValue);
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
	if (isString(value.time)) {
		value.time = stringToBusinessDay(value.time);
	}
}

export function convertStringsToBusinessDays(data: TimedData<Time>[]): void {
	return data.forEach(convertStringToBusinessDay);
}
