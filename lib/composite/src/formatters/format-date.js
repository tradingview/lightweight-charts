"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = void 0;
const price_formatter_1 = require("./price-formatter");
const getMonth = (date) => date.getUTCMonth() + 1;
const getDay = (date) => date.getUTCDate();
const getYear = (date) => date.getUTCFullYear();
const dd = (date) => (0, price_formatter_1.numberToStringWithLeadingZero)(getDay(date), 2);
const MMMM = (date, locale) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
    .toLocaleString(locale, { month: 'long' });
const MMM = (date, locale) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
    .toLocaleString(locale, { month: 'short' });
const MM = (date) => (0, price_formatter_1.numberToStringWithLeadingZero)(getMonth(date), 2);
const yy = (date) => (0, price_formatter_1.numberToStringWithLeadingZero)(getYear(date) % 100, 2);
const yyyy = (date) => (0, price_formatter_1.numberToStringWithLeadingZero)(getYear(date), 4);
function formatDate(date, format, locale) {
    return format
        .replace(/yyyy/g, yyyy(date))
        .replace(/yy/g, yy(date))
        .replace(/MMMM/g, MMMM(date, locale))
        .replace(/MMM/g, MMM(date, locale))
        .replace(/MM/g, MM(date))
        .replace(/dd/g, dd(date));
}
exports.formatDate = formatDate;
