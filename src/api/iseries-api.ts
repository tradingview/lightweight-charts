import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';

/** Interface to be implemened by the object in order to be used as a price formatter */
export interface IPriceFormatter {
	/**
	 * Formatting function
	 * @param price - original price to be formatted
	 * @return - formatted price
	 */
	format(price: BarPrice): string;
}

/** Basic interface implemented by all series objects */
export interface ISeriesApi {
	/**
	 * Returns current price formatter
	 * @return - interface to the price formatter object that can be used to format prices in the same way as the chart does
	 */
	priceFormatter(): IPriceFormatter;

	/** Converts specified series price to pixel coordinate according to the chart price scale
	 * @param price - input price to be converted
	 * @result - pixel coordinate of the price level on the chart
	 */
	priceToCoordinate(price: BarPrice): Coordinate | null;
}
