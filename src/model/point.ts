import { Coordinate } from './coordinate';

/**
 * Represents a point on the chart.
 */
export interface Point {
	/**
	 * The x coordinate.
	 */
	readonly x: Coordinate;
	/**
	 * The y coordinate.
	 */
	readonly y: Coordinate;
}

/**
 * Represents a point input from the user.
 */
export interface UserPoint {
	/**
	 * The x coordinate.
	 */
	readonly time: number;
	/**
	 * The y coordinate.
	 */
	readonly price: number;
}
