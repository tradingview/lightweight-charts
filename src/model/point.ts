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
