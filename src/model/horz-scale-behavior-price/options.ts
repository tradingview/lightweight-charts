import { ChartOptionsImpl } from '../chart-model';
import { LocalizationOptions } from '../localization-options';
import { HorzScalePriceItem } from './types';

/**
 * Extends LocalizationOptions for price-based charts.
 * Includes settings specific to formatting price values on the horizontal scale.
 */
export interface PriceChartLocalizationOptions
	extends LocalizationOptions<HorzScalePriceItem> {
	/**
     * The number of decimal places to display for price values on the horizontal scale.
     */
	precision: number;
}

/**
 * Configuration options specific to price-based charts.
 * Extends the base chart options and includes localization settings for price formatting.
 */
export interface PriceChartOptions extends ChartOptionsImpl<number> {
	/**
     * Localization options for formatting price values and other chart elements.
     */
	localization: PriceChartLocalizationOptions;
}
