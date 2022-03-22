import { Nominal } from '../helpers/nominal';

import { Coordinate } from './coordinate';

/**
 * Represents a price as a `number`.
 */
export type BarPrice = Nominal<number, 'BarPrice'>;

/**
 * Represents a bar's open, high, low, close (OHLC) prices.
 */
export interface BarPrices {
	/**
	 * The open price.
	 */
	open: BarPrice;
	/**
	 * The high price.
	 */
	high: BarPrice;
	/**
	 * The low price.
	 */
	low: BarPrice;
	/**
	 * The close price.
	 */
	close: BarPrice;
}

/**
 * Represents the y-axis coordinates of a bar's open, high, low, close prices.
 */
export interface BarCoordinates {
	openY: Coordinate;
	highY: Coordinate;
	lowY: Coordinate;
	closeY: Coordinate;
}
