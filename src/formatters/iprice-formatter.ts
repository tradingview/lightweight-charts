/** Interface to be implemented by the object in order to be used as a price formatter */
export interface IPriceFormatter {
	/**
	 * Formatting function
	 *
	 * @param price - Original price to be formatted
	 * @returns Formatted price
	 */
	format(price: number): string;
}
