import { PriceLineOptions } from '../model/price-line-options';

/**
 * Represents the interface for interacting with price lines.
 */
export interface IPriceLine {
	/**
	 * Apply options to the price line.
	 *
	 * @param options The options to apply.
	 */
	applyOptions(options: Partial<PriceLineOptions>): void;
	/**
	 * Get the currently applied options.
	 */
	options(): Readonly<PriceLineOptions>;
}
