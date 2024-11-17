import { isString } from '../../helpers/strict-type-checks';
import { isBusinessDay, isUTCTimestamp } from './types';
export function businessDayConverter(time) {
    let businessDay = time;
    if (isString(time)) {
        businessDay = stringToBusinessDay(time);
    }
    if (!isBusinessDay(businessDay)) {
        throw new Error('time must be of type BusinessDay');
    }
    const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));
    return {
        timestamp: Math.round(date.getTime() / 1000),
        businessDay,
    };
}
export function timestampConverter(time) {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        timestamp: time,
    };
}
export function selectTimeConverter(data) {
    if (data.length === 0) {
        return null;
    }
    if (isBusinessDay(data[0].time) || isString(data[0].time)) {
        return businessDayConverter;
    }
    return timestampConverter;
}
const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;
export function convertTime(time) {
    if (isUTCTimestamp(time)) {
        return timestampConverter(time);
    }
    if (!isBusinessDay(time)) {
        return businessDayConverter(stringToBusinessDay(time));
    }
    return businessDayConverter(time);
}
export function stringToBusinessDay(value) {
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
export function convertStringToBusinessDay(value) {
    if (isString(value.time)) {
        value.time = stringToBusinessDay(value.time);
    }
}
export function convertStringsToBusinessDays(data) {
    return data.forEach(convertStringToBusinessDay);
}
