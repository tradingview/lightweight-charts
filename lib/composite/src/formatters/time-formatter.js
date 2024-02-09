"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeFormatter = void 0;
const price_formatter_1 = require("./price-formatter");
class TimeFormatter {
    constructor(format) {
        this._formatStr = format || '%h:%m:%s';
    }
    format(date) {
        return this._formatStr.replace('%h', (0, price_formatter_1.numberToStringWithLeadingZero)(date.getUTCHours(), 2)).
            replace('%m', (0, price_formatter_1.numberToStringWithLeadingZero)(date.getUTCMinutes(), 2)).
            replace('%s', (0, price_formatter_1.numberToStringWithLeadingZero)(date.getUTCSeconds(), 2));
    }
}
exports.TimeFormatter = TimeFormatter;
