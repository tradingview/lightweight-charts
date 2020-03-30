import { numberToStringWithLeadingZero as numToStr } from './price-formatter';

const getMonth = (date: Date) => date.getUTCMonth() + 1;
const getDay = (date: Date) => date.getUTCDate();
const getYear = (date: Date) => date.getUTCFullYear();

const dd = (date: Date) => numToStr(getDay(date), 2);
const MMMM = (date: Date, locale: string) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
	.toLocaleString(locale, { month: 'long' });
const MMM = (date: Date, locale: string) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
	.toLocaleString(locale, { month: 'short' });
const MM = (date: Date) => numToStr(getMonth(date), 2);
const yy = (date: Date) => numToStr(getYear(date) % 100, 2);
const yyyy = (date: Date) => numToStr(getYear(date), 4);

export function formatDate(date: Date, format: string, locale: string): string {
	return format
		.replace(/yyyy/g, yyyy(date))
		.replace(/yy/g, yy(date))
		.replace(/MMMM/g, MMMM(date, locale))
		.replace(/MMM/g, MMM(date, locale))
		.replace(/MM/g, MM(date))
		.replace(/dd/g, dd(date))
	;
}
