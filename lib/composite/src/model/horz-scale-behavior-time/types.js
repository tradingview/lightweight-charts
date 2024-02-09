"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickMarkWeight = exports.TickMarkType = exports.isUTCTimestamp = exports.isBusinessDay = void 0;
const strict_type_checks_1 = require("../../helpers/strict-type-checks");
/**
 * Check if a time value is a business day object.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link BusinessDay} object, false otherwise.
 */
function isBusinessDay(time) {
    return !(0, strict_type_checks_1.isNumber)(time) && !(0, strict_type_checks_1.isString)(time);
}
exports.isBusinessDay = isBusinessDay;
/**
 * Check if a time value is a UTC timestamp number.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link UTCTimestamp} number, false otherwise.
 */
function isUTCTimestamp(time) {
    return (0, strict_type_checks_1.isNumber)(time);
}
exports.isUTCTimestamp = isUTCTimestamp;
/**
 * Represents the type of a tick mark on the time axis.
 */
var TickMarkType;
(function (TickMarkType) {
    /**
     * The start of the year (e.g. it's the first tick mark in a year).
     */
    TickMarkType[TickMarkType["Year"] = 0] = "Year";
    /**
     * The start of the month (e.g. it's the first tick mark in a month).
     */
    TickMarkType[TickMarkType["Month"] = 1] = "Month";
    /**
     * A day of the month.
     */
    TickMarkType[TickMarkType["DayOfMonth"] = 2] = "DayOfMonth";
    /**
     * A time without seconds.
     */
    TickMarkType[TickMarkType["Time"] = 3] = "Time";
    /**
     * A time with seconds.
     */
    TickMarkType[TickMarkType["TimeWithSeconds"] = 4] = "TimeWithSeconds";
})(TickMarkType = exports.TickMarkType || (exports.TickMarkType = {}));
/**
 * Describes a weight of tick mark, i.e. a part of a time that changed since previous time.
 * Note that you can use any timezone to calculate this value, it is unnecessary to use UTC.
 *
 * @example Between 2020-01-01 and 2020-01-02 there is a day of difference, i.e. for 2020-01-02 weight would be a day.
 * @example Between 2020-01-01 and 2020-02-02 there is a month of difference, i.e. for 2020-02-02 weight would be a month.
 */
var TickMarkWeight;
(function (TickMarkWeight) {
    TickMarkWeight[TickMarkWeight["LessThanSecond"] = 0] = "LessThanSecond";
    TickMarkWeight[TickMarkWeight["Second"] = 10] = "Second";
    TickMarkWeight[TickMarkWeight["Minute1"] = 20] = "Minute1";
    TickMarkWeight[TickMarkWeight["Minute5"] = 21] = "Minute5";
    TickMarkWeight[TickMarkWeight["Minute30"] = 22] = "Minute30";
    TickMarkWeight[TickMarkWeight["Hour1"] = 30] = "Hour1";
    TickMarkWeight[TickMarkWeight["Hour3"] = 31] = "Hour3";
    TickMarkWeight[TickMarkWeight["Hour6"] = 32] = "Hour6";
    TickMarkWeight[TickMarkWeight["Hour12"] = 33] = "Hour12";
    TickMarkWeight[TickMarkWeight["Day"] = 50] = "Day";
    TickMarkWeight[TickMarkWeight["Month"] = 60] = "Month";
    TickMarkWeight[TickMarkWeight["Year"] = 70] = "Year";
})(TickMarkWeight = exports.TickMarkWeight || (exports.TickMarkWeight = {}));
