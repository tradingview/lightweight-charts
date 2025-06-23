/** Interface to be implemented by the object in order to be used as a price formatter */
export interface IPriceFormatter {
	/**
	 * Formatting function
	 *
	 * @param price - Original price to be formatted
	 * @returns Formatted price
	 */
	format(price: number): string;

	/**
	 * Formatting function. This function is used for consistent format adjusting for all prices
	 * @param prices - Prices to be formatted
	 * @returns Formatted prices
	 */
	formatTickmarks(prices: readonly number[]): string[];
}
