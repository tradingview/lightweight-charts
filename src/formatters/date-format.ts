import { numberToStringWithLeadingZero as numToStr } from './price-formatter';

const getMonth = (date: Date) => date.getUTCMonth() + 1;
const getDay = (date: Date) => date.getUTCDate();
const getYear = (date: Date) => date.getUTCFullYear();

const dd = (date: Date) => numToStr(getDay(date), 2);
const MMM = (date: Date, locale: string) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
	.toLocaleString(locale, { month: 'short' });
const MM = (date: Date) => numToStr(getMonth(date), 2);
const yy = (date: Date) => numToStr(getYear(date) % 100, 2);
const yyyy = (date: Date) => numToStr(getYear(date), 4);

export type DateFormat =
	| 'dd MMM \'yy'
	| 'yyyy-MM-dd'
	| 'yy-MM-dd'
	| 'yy/MM/dd'
	| 'yyyy/MM/dd'
	| 'dd-MM-yyyy'
	| 'dd-MM-yy'
	| 'dd/MM/yy'
	| 'dd/MM/yyyy'
	| 'MM/dd/yy'
	| 'MM/dd/yyyy'
;

export type DateFormatFn = (date: Date, locale: string) => string;

/*
 Map of date formatting functions
 */
export const dateFormatFunctions: Record<DateFormat, DateFormatFn> = {
	'dd MMM \'yy': (date: Date, locale: string) => `${dd(date)} ${MMM(date, locale)} \'${yy(date)}`,
	'yyyy-MM-dd': (date: Date, locale: string) => `${yyyy(date)}-${MM(date)}-${dd(date)}`,
	'yy-MM-dd': (date: Date, locale: string) => `${yy(date)}-${MM(date)}-${dd(date)}`,
	'yy/MM/dd': (date: Date, locale: string) => `${yy(date)}/${MM(date)}/${dd(date)}`,
	'yyyy/MM/dd': (date: Date, locale: string) => `${yyyy(date)}/${MM(date)}/${dd(date)}`,
	'dd-MM-yyyy': (date: Date, locale: string) => `${dd(date)}-${MM(date)}-${yyyy(date)}`,
	'dd-MM-yy': (date: Date, locale: string) => `${dd(date)}-${MM(date)}-${yy(date)}`,
	'dd/MM/yy': (date: Date, locale: string) => `${dd(date)}/${MM(date)}/${yy(date)}`,
	'dd/MM/yyyy': (date: Date, locale: string) => `${dd(date)}/${MM(date)}/${yyyy(date)}`,
	'MM/dd/yy': (date: Date, locale: string) => `${MM(date)}/${dd(date)}/${yy(date)}`,
	'MM/dd/yyyy': (date: Date, locale: string) => `${MM(date)}/${dd(date)}/${yyyy(date)}`,
};
