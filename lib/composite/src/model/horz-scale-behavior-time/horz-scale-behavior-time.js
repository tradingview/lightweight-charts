"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorzScaleBehaviorTime = exports.stringToBusinessDay = exports.convertTime = void 0;
const date_formatter_1 = require("../../formatters/date-formatter");
const date_time_formatter_1 = require("../../formatters/date-time-formatter");
const assertions_1 = require("../../helpers/assertions");
const strict_type_checks_1 = require("../../helpers/strict-type-checks");
const time_scale_1 = require("../time-scale");
const default_tick_mark_formatter_1 = require("./default-tick-mark-formatter");
const time_scale_point_weight_generator_1 = require("./time-scale-point-weight-generator");
const types_1 = require("./types");
function businessDayConverter(time) {
    let businessDay = time;
    if ((0, strict_type_checks_1.isString)(time)) {
        businessDay = stringToBusinessDay(time);
    }
    if (!(0, types_1.isBusinessDay)(businessDay)) {
        throw new Error('time must be of type BusinessDay');
    }
    const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));
    return {
        timestamp: Math.round(date.getTime() / 1000),
        businessDay,
    };
}
function timestampConverter(time) {
    if (!(0, types_1.isUTCTimestamp)(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        timestamp: time,
    };
}
function selectTimeConverter(data) {
    if (data.length === 0) {
        return null;
    }
    if ((0, types_1.isBusinessDay)(data[0].time) || (0, strict_type_checks_1.isString)(data[0].time)) {
        return businessDayConverter;
    }
    return timestampConverter;
}
const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;
function convertTime(time) {
    if ((0, types_1.isUTCTimestamp)(time)) {
        return timestampConverter(time);
    }
    if (!(0, types_1.isBusinessDay)(time)) {
        return businessDayConverter(stringToBusinessDay(time));
    }
    return businessDayConverter(time);
}
exports.convertTime = convertTime;
function stringToBusinessDay(value) {
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
exports.stringToBusinessDay = stringToBusinessDay;
function convertStringToBusinessDay(value) {
    if ((0, strict_type_checks_1.isString)(value.time)) {
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
class HorzScaleBehaviorTime {
    options() {
        return this._options;
    }
    setOptions(options) {
        this._options = options;
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
        return (0, assertions_1.ensureNotNull)(selectTimeConverter(data));
    }
    key(item) {
        // eslint-disable-next-line no-restricted-syntax
        if (typeof item === 'object' && 'timestamp' in item) {
            return item.timestamp;
        }
        else {
            return this.key(this.convertHorzItemToInternal(item));
        }
    }
    cacheKey(item) {
        const time = item;
        return time.businessDay === undefined
            ? new Date(time.timestamp * 1000).getTime()
            : new Date(Date.UTC(time.businessDay.year, time.businessDay.month - 1, time.businessDay.day)).getTime();
    }
    convertHorzItemToInternal(item) {
        return convertTime(item);
    }
    updateFormatter(options) {
        if (!this._options) {
            return;
        }
        const dateFormat = options.dateFormat;
        if (this._options.timeScale.timeVisible) {
            this._dateTimeFormatter = new date_time_formatter_1.DateTimeFormatter({
                dateFormat: dateFormat,
                timeFormat: this._options.timeScale.secondsVisible ? '%h:%m:%s' : '%h:%m',
                dateTimeSeparator: '   ',
                locale: options.locale,
            });
        }
        else {
            this._dateTimeFormatter = new date_formatter_1.DateFormatter(dateFormat, options.locale);
        }
    }
    formatHorzItem(item) {
        const tp = item;
        return this._dateTimeFormatter.format(new Date(tp.timestamp * 1000));
    }
    formatTickmark(tickMark, localizationOptions) {
        const tickMarkType = weightToTickMarkType(tickMark.weight, this._options.timeScale.timeVisible, this._options.timeScale.secondsVisible);
        const options = this._options.timeScale;
        if (options.tickMarkFormatter !== undefined) {
            const tickMarkString = options.tickMarkFormatter(tickMark.originalTime, tickMarkType, localizationOptions.locale);
            if (tickMarkString !== null) {
                return tickMarkString;
            }
        }
        return (0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(tickMark.time, tickMarkType, localizationOptions.locale);
    }
    maxTickMarkWeight(tickMarks) {
        let maxWeight = tickMarks.reduce(time_scale_1.markWithGreaterWeight, tickMarks[0]).weight;
        // special case: it looks strange if 15:00 is bold but 14:00 is not
        // so if maxWeight > TickMarkWeight.Hour1 and < TickMarkWeight.Day reduce it to TickMarkWeight.Hour1
        if (maxWeight > 30 /* TickMarkWeight.Hour1 */ && maxWeight < 50 /* TickMarkWeight.Day */) {
            maxWeight = 30 /* TickMarkWeight.Hour1 */;
        }
        return maxWeight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        (0, time_scale_point_weight_generator_1.fillWeightsForPoints)(sortedTimePoints, startIndex);
    }
    static applyDefaults(options) {
        return (0, strict_type_checks_1.merge)({ localization: { dateFormat: 'dd MMM \'yy' } }, options !== null && options !== void 0 ? options : {});
    }
}
exports.HorzScaleBehaviorTime = HorzScaleBehaviorTime;
