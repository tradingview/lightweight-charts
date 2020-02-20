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

export type DateFormat =
	| '\'yy MMM dd'
	| '\'yy MMMM dd'
	| 'yyyy MMM dd'
	| 'yyyy MMMM dd'
	| 'dd MMM \'yy'
	| 'dd MMMM \'yy'
	| 'dd MMM yyyy'
	| 'dd MMMM yyyy'
	| 'MMM dd, \'yy'
	| 'MMMM dd, \'yy'
	| 'MMM dd, yyyy'
	| 'MMMM dd, yyyy'
	| 'yyyy-MM-dd'
	| 'yy-MM-dd'
	| 'yy/MM/dd'
	| 'yyyy/MM/dd'
	| 'yy.MM.dd'
	| 'yyyy.MM.dd'
	| 'dd-MM-yyyy'
	| 'dd-MM-yy'
	| 'dd/MM/yy'
	| 'dd/MM/yyyy'
	| 'dd.MM.yy'
	| 'dd.MM.yyyy'
	| 'MM-dd-yy'
	| 'MM-dd-yyyy'
	| 'MM/dd/yy'
	| 'MM/dd/yyyy'
	| 'MM.dd.yy'
	| 'MM.dd.yyyy'
;

export type DateFormatFn = (date: Date, locale: string) => string;

/*
 Map of date formatting functions
 */
export const dateFormatFunctions: Record<DateFormat, DateFormatFn> = {
	'\'yy MMM dd': (date: Date, locale: string) => `\'${yy(date)} ${MMM(date, locale)} ${dd(date)}`,
	'\'yy MMMM dd': (date: Date, locale: string) => `\'${yy(date)} ${MMMM(date, locale)} ${dd(date)}`,
	'yyyy MMM dd': (date: Date, locale: string) => `${yyyy(date)} ${MMM(date, locale)} ${dd(date)}`,
	'yyyy MMMM dd': (date: Date, locale: string) => `${yyyy(date)} ${MMMM(date, locale)} ${dd(date)}`,
	'dd MMM \'yy': (date: Date, locale: string) => `${dd(date)} ${MMM(date, locale)} \'${yy(date)}`,
	'dd MMMM \'yy': (date: Date, locale: string) => `${dd(date)} ${MMMM(date, locale)} \'${yy(date)}`,
	'dd MMM yyyy': (date: Date, locale: string) => `${dd(date)} ${MMM(date, locale)} ${yyyy(date)}`,
	'dd MMMM yyyy': (date: Date, locale: string) => `${dd(date)} ${MMMM(date, locale)} ${yyyy(date)}`,
	'MMM dd, \'yy': (date: Date, locale: string) => `${MMM(date, locale)} ${dd(date)}, \'${yy(date)}`,
	'MMMM dd, \'yy': (date: Date, locale: string) => `${MMMM(date, locale)} ${dd(date)}, \'${yy(date)}`,
	'MMM dd, yyyy': (date: Date, locale: string) => `${MMM(date, locale)} ${dd(date)}, ${yyyy(date)}`,
	'MMMM dd, yyyy': (date: Date, locale: string) => `${MMMM(date, locale)} ${dd(date)}, ${yyyy(date)}`,
	'yyyy-MM-dd': (date: Date, locale: string) => `${yyyy(date)}-${MM(date)}-${dd(date)}`,
	'yy-MM-dd': (date: Date, locale: string) => `${yy(date)}-${MM(date)}-${dd(date)}`,
	'yy/MM/dd': (date: Date, locale: string) => `${yy(date)}/${MM(date)}/${dd(date)}`,
	'yyyy/MM/dd': (date: Date, locale: string) => `${yyyy(date)}/${MM(date)}/${dd(date)}`,
	'yy.MM.dd': (date: Date, locale: string) => `${yy(date)}.${MM(date)}.${dd(date)}`,
	'yyyy.MM.dd': (date: Date, locale: string) => `${yyyy(date)}.${MM(date)}.${dd(date)}`,
	'dd-MM-yyyy': (date: Date, locale: string) => `${dd(date)}-${MM(date)}-${yyyy(date)}`,
	'dd-MM-yy': (date: Date, locale: string) => `${dd(date)}-${MM(date)}-${yy(date)}`,
	'dd/MM/yy': (date: Date, locale: string) => `${dd(date)}/${MM(date)}/${yy(date)}`,
	'dd/MM/yyyy': (date: Date, locale: string) => `${dd(date)}/${MM(date)}/${yyyy(date)}`,
	'dd.MM.yy': (date: Date, locale: string) => `${dd(date)}.${MM(date)}.${yy(date)}`,
	'dd.MM.yyyy': (date: Date, locale: string) => `${dd(date)}.${MM(date)}.${yyyy(date)}`,
	'MM-dd-yy': (date: Date, locale: string) => `${MM(date)}-${dd(date)}-${yy(date)}`,
	'MM-dd-yyyy': (date: Date, locale: string) => `${MM(date)}-${dd(date)}-${yyyy(date)}`,
	'MM/dd/yy': (date: Date, locale: string) => `${MM(date)}/${dd(date)}/${yy(date)}`,
	'MM/dd/yyyy': (date: Date, locale: string) => `${MM(date)}/${dd(date)}/${yyyy(date)}`,
	'MM.dd.yy': (date: Date, locale: string) => `${MM(date)}.${dd(date)}.${yy(date)}`,
	'MM.dd.yyyy': (date: Date, locale: string) => `${MM(date)}.${dd(date)}.${yyyy(date)}`,
};
