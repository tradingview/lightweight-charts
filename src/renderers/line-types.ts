import { Coordinate } from '../model/coordinate';

/**
 * Represents the width of a line.
 */
export type LineWidth = 1 | 2 | 3 | 4;

/**
 * Represents the possible line types.
 */
export const enum LineType {
	/**
	 * A line.
	 */
	Simple,
	/**
	 * A stepped line.
	 */
	WithSteps,
	/**
	 * A curved line.
	 */
	Curved,
}

/**
 * A point on a line.
 */
export interface LinePoint {
	/**
	 * The point's x coordinate.
	 */
	x: Coordinate;
	/**
	 * The point's y coordinate.
	 */
	y: Coordinate;
}

/**
 * Represents the possible line styles.
 */
export const enum LineStyle {
	/**
	 * A solid line.
	 */
	Solid = 0,
	/**
	 * A dotted line.
	 */
	Dotted = 1,
	/**
	 * A dashed line.
	 */
	Dashed = 2,
	/**
	 * A dashed line with bigger dashes.
	 */
	LargeDashed = 3,
	/**
	 * A dotted line with more space between dots.
	 */
	SparseDotted = 4,
}
