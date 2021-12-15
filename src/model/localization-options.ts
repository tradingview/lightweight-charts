import { PriceFormatterFn } from './price-formatter-fn';
import { Time } from './time-data';

/**
 * A custom function used to override formatting of a time to a string.
 */
export type TimeFormatterFn = (time: Time) => string;

/**
 * Represents options for formatting dates, times, and prices according to a locale.
 */
export interface LocalizationOptions {
	/**
	 * Current locale used to format dates. Uses the browser's language settings by default.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
	 * @defaultValue `navigator.language`
	 */
	locale: string;

	/**
	 * Override formatting of the price scale crosshair label. Can be used for cases that can't be covered with built-in price formats.
	 *
	 * @see {@link PriceFormatCustom}
	 * @defaultValue `undefined`
	 */
	priceFormatter?: PriceFormatterFn;

	/**
	 * Override formatting of the time scale crosshair label.
	 *
	 * @defaultValue `undefined`
	 */
	timeFormatter?: TimeFormatterFn;

	/**
	 * Date formatting string.
	 *
	 * Can contain `yyyy`, `yy`, `MMMM`, `MMM`, `MM` and `dd` literals which will be replaced with corresponding date's value.
	 *
	 * Ignored if {@link timeFormatter} has been specified.
	 *
	 * @defaultValue `'dd MMM \'yy'`
	 */
	dateFormat: string;
}
