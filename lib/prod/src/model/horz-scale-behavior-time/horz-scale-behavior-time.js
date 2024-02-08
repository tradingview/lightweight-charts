import { DateFormatter } from '../../formatters/date-formatter';
import { DateTimeFormatter } from '../../formatters/date-time-formatter';
import { ensureNotNull } from '../../helpers/assertions';
import { isString, merge } from '../../helpers/strict-type-checks';
import { markWithGreaterWeight } from '../time-scale';
import { defaultTickMarkFormatter } from './default-tick-mark-formatter';
import { fillWeightsForPoints } from './time-scale-point-weight-generator';
import { isBusinessDay, isUTCTimestamp } from './types';
function businessDayConverter(time) {
    let businessDay = time;
    if (isString(time)) {
        businessDay = stringToBusinessDay(time);
    }
    if (!isBusinessDay(businessDay)) {
        throw new Error('time must be of type BusinessDay');
    }
    const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));
    return {
        _internal_timestamp: Math.round(date.getTime() / 1000),
        _internal_businessDay: businessDay,
    };
}
function timestampConverter(time) {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        _internal_timestamp: time,
    };
}
function selectTimeConverter(data) {
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
function convertStringToBusinessDay(value) {
    if (isString(value.time)) {
        value.time = stringToBusinessDay(value.time);
    }
}
function convertStringsToBusinessDays(data) {
    return data.forEach(convertStringToBusinessDay);
}
// eslint-disable-next-line complexity
function weightToTickMarkType(weight, timeVisible, secondsVisible) {
    switch (weight) {
        case 0 /* TickMarkWeight.LessThanSecond */:
        case 10 /* TickMarkWeight.Second */:
            return timeVisible
                ? (secondsVisible ? 4 /* TickMarkType.TimeWithSeconds */ : 3 /* TickMarkType.Time */)
                : 2 /* TickMarkType.DayOfMonth */;
        case 20 /* TickMarkWeight.Minute1 */:
        case 21 /* TickMarkWeight.Minute5 */:
        case 22 /* TickMarkWeight.Minute30 */:
        case 30 /* TickMarkWeight.Hour1 */:
        case 31 /* TickMarkWeight.Hour3 */:
        case 32 /* TickMarkWeight.Hour6 */:
        case 33 /* TickMarkWeight.Hour12 */:
            return timeVisible ? 3 /* TickMarkType.Time */ : 2 /* TickMarkType.DayOfMonth */;
        case 50 /* TickMarkWeight.Day */:
            return 2 /* TickMarkType.DayOfMonth */;
        case 60 /* TickMarkWeight.Month */:
            return 1 /* TickMarkType.Month */;
        case 70 /* TickMarkWeight.Year */:
            return 0 /* TickMarkType.Year */;
    }
}
export class HorzScaleBehaviorTime {
    options() {
        return this._private__options;
    }
    setOptions(options) {
        this._private__options = options;
        this.updateFormatter(options.localization);
    }
    preprocessData(data) {
        if (Array.isArray(data)) {
            convertStringsToBusinessDays(data);
        }
        else {
            convertStringToBusinessDay(data);
        }
    }
    createConverterToInternalObj(data) {
        return ensureNotNull(selectTimeConverter(data));
    }
    key(item) {
        // eslint-disable-next-line no-restricted-syntax
        if (typeof item === 'object' && "_internal_timestamp" in item) {
            return item._internal_timestamp;
        }
        else {
            return this.key(this.convertHorzItemToInternal(item));
        }
    }
    cacheKey(item) {
        const time = item;
        return time._internal_businessDay === undefined
            ? new Date(time._internal_timestamp * 1000).getTime()
            : new Date(Date.UTC(time._internal_businessDay.year, time._internal_businessDay.month - 1, time._internal_businessDay.day)).getTime();
    }
    convertHorzItemToInternal(item) {
        return convertTime(item);
    }
    updateFormatter(options) {
        if (!this._private__options) {
            return;
        }
        const dateFormat = options.dateFormat;
        if (this._private__options.timeScale.timeVisible) {
            this._private__dateTimeFormatter = new DateTimeFormatter({
                _internal_dateFormat: dateFormat,
                _internal_timeFormat: this._private__options.timeScale.secondsVisible ? '%h:%m:%s' : '%h:%m',
                _internal_dateTimeSeparator: '   ',
                _internal_locale: options.locale,
            });
        }
        else {
            this._private__dateTimeFormatter = new DateFormatter(dateFormat, options.locale);
        }
    }
    formatHorzItem(item) {
        const tp = item;
        return this._private__dateTimeFormatter._internal_format(new Date(tp._internal_timestamp * 1000));
    }
    formatTickmark(tickMark, localizationOptions) {
        const tickMarkType = weightToTickMarkType(tickMark.weight, this._private__options.timeScale.timeVisible, this._private__options.timeScale.secondsVisible);
        const options = this._private__options.timeScale;
        if (options.tickMarkFormatter !== undefined) {
            const tickMarkString = options.tickMarkFormatter(tickMark.originalTime, tickMarkType, localizationOptions.locale);
            if (tickMarkString !== null) {
                return tickMarkString;
            }
        }
        return defaultTickMarkFormatter(tickMark.time, tickMarkType, localizationOptions.locale);
    }
    maxTickMarkWeight(tickMarks) {
        let maxWeight = tickMarks.reduce(markWithGreaterWeight, tickMarks[0]).weight;
        // special case: it looks strange if 15:00 is bold but 14:00 is not
        // so if maxWeight > TickMarkWeight.Hour1 and < TickMarkWeight.Day reduce it to TickMarkWeight.Hour1
        if (maxWeight > 30 /* TickMarkWeight.Hour1 */ && maxWeight < 50 /* TickMarkWeight.Day */) {
            maxWeight = 30 /* TickMarkWeight.Hour1 */;
        }
        return maxWeight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        fillWeightsForPoints(sortedTimePoints, startIndex);
    }
    static _internal_applyDefaults(options) {
        return merge({ localization: { dateFormat: 'dd MMM \'yy' } }, options !== null && options !== void 0 ? options : {});
    }
}
