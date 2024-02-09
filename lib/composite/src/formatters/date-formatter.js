"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFormatter = void 0;
const format_date_1 = require("./format-date");
class DateFormatter {
    constructor(dateFormat = 'yyyy-MM-dd', locale = 'default') {
        this._dateFormat = dateFormat;
        this._locale = locale;
    }
    format(date) {
        return (0, format_date_1.formatDate)(date, this._dateFormat, this._locale);
    }
}
exports.DateFormatter = DateFormatter;
