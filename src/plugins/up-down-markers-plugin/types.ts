import { Time } from '../../model/horz-scale-behavior-time/types';

/**
 * Enumeration representing the sign of a marker.
 */
export const enum MarkerSign {
	/** Represents a negative change (-1) */
	Negative = -1,
	/** Represents no change (0) */
	Neutral,
	/** Represents a positive change (1) */
	Positive,
}

/**
 * Represents a marker drawn above or below a data point to indicate a price change update.
 * @template T The type of the time value, defaults to Time.
 */
export interface SeriesUpDownMarker<T = Time> {
	/**
	 * The point on the horizontal scale.
	 */
	time: T;

	/**
	 * The price value for the data point.
	 */
	value: number;

	/**
	 * The direction of the price change.
	 */
	sign: MarkerSign;
}

/**
 * Represents the coordinates and sign of a marker on the chart.
 */
export interface MarkerCoordinates {
	x: number;
	y: number;
	sign: number;
}

/**
 * Defines the supported series types for up down markers primitive plugin.
 */
export type UpDownMarkersSupportedSeriesTypes = 'Line' | 'Area';
