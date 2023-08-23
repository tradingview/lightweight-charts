import { Time } from './horz-scale-behavior-time/types';
import { PercentageFormatterFn, PriceFormatterFn } from './price-formatter-fn';

/**
 * A custom function used to override formatting of a time to a string.
 */
export type TimeFormatterFn<HorzScaleItem = Time> = (time: HorzScaleItem) => string;

/**
 * Represents basic localization options
 */
export interface LocalizationOptionsBase {
	/**
	 * Current locale used to format dates. Uses the browser's language settings by default.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
	 * @defaultValue `navigator.language`
	 */
	locale: string;

	/**
	 * Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.
	 *
	 * @see {@link PriceFormatCustom}
	 * @defaultValue `undefined`
	 */
	priceFormatter?: PriceFormatterFn;

	/**
	 * Override formatting of the percentage scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in percentage format.
	 *
	 * @defaultValue `undefined`
	 */
	percentageFormatter?: PercentageFormatterFn;
}

/**
 * Represents options for formatting dates, times, and prices according to a locale.
 */
export interface LocalizationOptions<HorzScaleItem> extends LocalizationOptionsBase {

	/**
	 * Override formatting of the time scale crosshair label.
	 *
	 * @defaultValue `undefined`
	 */
	timeFormatter?: TimeFormatterFn<HorzScaleItem>;

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
