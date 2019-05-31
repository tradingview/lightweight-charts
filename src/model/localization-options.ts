import { DateFormat } from '../formatters/date-format';

import { BarPrice } from './bar';
import { BusinessDay, UTCTimestamp } from './time-data';

export type TimeFormatterFn = (time: BusinessDay | UTCTimestamp) => string;
export type PriceFormatterFn = (priceValue: BarPrice) => string;

export interface LocalizationOptions {
	/**
	 * Current locale, which will be used for formatting dates.
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
	 */
	locale: string;

	/**
	 * User-defined function for price formatting. Could be used for some specific cases, that could not be covered with PriceFormat
	 */
	priceFormatter?: PriceFormatterFn;

	/**
	 * User-defined function for time formatting.
	 */
	timeFormatter?: TimeFormatterFn;

	/**
	 * One of predefined variants to format time. Ignored if timeFormatter has been specified.
	 */
	dateFormat: DateFormat;
}
