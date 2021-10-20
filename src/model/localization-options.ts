import { PriceFormatterFn } from './price-formatter-fn';
import { BusinessDay, UTCTimestamp } from './time-data';

/**
 * A custom function used to override formatting of a time to a string.
 */
export type TimeFormatterFn = (time: BusinessDay | UTCTimestamp) => string;

/**
 * Represents options for formattings dates, times, and prices according to a locale.
 */
export interface LocalizationOptions {
	/**
	 * Current locale used to format dates. Uses the browser's language settings by default.
	 *
	 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
	 *
	 */
	locale: string;

	/**
	 * Override fomatting of the price scale crosshair label. Can be used for cases that can't be covered with built-in price formats.
	 *
	 * See also {@link PriceFormatCustom}.
	 */
	priceFormatter?: PriceFormatterFn;

	/**
	 * Override formatting of the time scale crosshair label.
	 */
	timeFormatter?: TimeFormatterFn;

	/**
	 * Date formatting string.
	 *
	 * Can contain `yyyy`, `yy`, `MMMM`, `MMM`, `MM` and `dd` literals which will be replaced with corresponding date's value.
	 *
	 * Ignored if timeFormatter has been specified.
	 */
	dateFormat: string;
}
