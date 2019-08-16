import { DateFormat } from '../formatters/date-format';

import { PriceFormatterFn } from './price-formatter-fn';
import { BusinessDay, UTCTimestamp } from './time-data';

export type TimeFormatterFn = (time: BusinessDay | UTCTimestamp) => string;

export interface LocalizationOptions {
	/**
	 * Current locale, which will be used for formatting dates.
	 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation}
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
	 * One of predefined options to format time. Ignored if timeFormatter has been specified.
	 */
	dateFormat: DateFormat;
}
