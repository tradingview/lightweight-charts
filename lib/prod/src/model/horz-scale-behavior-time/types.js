import { isNumber, isString } from '../../helpers/strict-type-checks';
/**
 * Check if a time value is a business day object.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link BusinessDay} object, false otherwise.
 */
export function isBusinessDay(time) {
    return !isNumber(time) && !isString(time);
}
/**
 * Check if a time value is a UTC timestamp number.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link UTCTimestamp} number, false otherwise.
 */
export function isUTCTimestamp(time) {
    return isNumber(time);
}
/**
 * Represents the type of a tick mark on the time axis.
 */
export var TickMarkType;
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
})(TickMarkType || (TickMarkType = {}));
;
