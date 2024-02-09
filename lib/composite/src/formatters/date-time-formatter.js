"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeFormatter = void 0;
const date_formatter_1 = require("./date-formatter");
const time_formatter_1 = require("./time-formatter");
const defaultParams = {
    dateFormat: 'yyyy-MM-dd',
    timeFormat: '%h:%m:%s',
    dateTimeSeparator: ' ',
    locale: 'default',
};
class DateTimeFormatter {
    constructor(params = {}) {
        const formatterParams = Object.assign(Object.assign({}, defaultParams), params);
        this._dateFormatter = new date_formatter_1.DateFormatter(formatterParams.dateFormat, formatterParams.locale);
        this._timeFormatter = new time_formatter_1.TimeFormatter(formatterParams.timeFormat);
        this._separator = formatterParams.dateTimeSeparator;
    }
    format(dateTime) {
        return `${this._dateFormatter.format(dateTime)}${this._separator}${this._timeFormatter.format(dateTime)}`;
    }
}
exports.DateTimeFormatter = DateTimeFormatter;
