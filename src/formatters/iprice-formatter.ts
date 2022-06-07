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
	 * Remove non-valuable ending zeros
	 *
	 * @param label - Result of the format method
	 * @returns Modified label without fractional part if all numbers after a decimal point are zeros
	 */
	tryCutFractionalZeros?(label: string): string | null;
}
