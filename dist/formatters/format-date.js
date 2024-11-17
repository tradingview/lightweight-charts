import { numberToStringWithLeadingZero as numToStr } from './price-formatter';
const getMonth = (date) => date.getUTCMonth() + 1;
const getDay = (date) => date.getUTCDate();
const getYear = (date) => date.getUTCFullYear();
const dd = (date) => numToStr(getDay(date), 2);
const MMMM = (date, locale) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
    .toLocaleString(locale, { month: 'long' });
const MMM = (date, locale) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
    .toLocaleString(locale, { month: 'short' });
const MM = (date) => numToStr(getMonth(date), 2);
const yy = (date) => numToStr(getYear(date) % 100, 2);
const yyyy = (date) => numToStr(getYear(date), 4);
export function formatDate(date, format, locale) {
    return format
        .replace(/yyyy/g, yyyy(date))
        .replace(/yy/g, yy(date))
        .replace(/MMMM/g, MMMM(date, locale))
        .replace(/MMM/g, MMM(date, locale))
        .replace(/MM/g, MM(date))
        .replace(/dd/g, dd(date));
}
