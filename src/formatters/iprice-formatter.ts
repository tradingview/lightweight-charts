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
	 * A formatting function for price scale tick marks. Use this function to define formatting rules based on all provided price values.
	 * @param prices - Prices to be formatted
	 * @returns Formatted prices
	 */
	formatTickmarks(prices: readonly number[]): string[];
}
