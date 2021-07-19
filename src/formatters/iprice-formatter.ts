/** Interface to be implemented by the object in order to be used as a price formatter */
export interface IPriceFormatter {
	/**
	 * Formatting function
	 *
	 * @param price - original price to be formatted
	 * @returns formatted price
	 */
	format(price: number): string;
}
