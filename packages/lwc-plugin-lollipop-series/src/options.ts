import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface LollipopSeriesOptions extends CustomSeriesOptions {
	/**
	 * Price the stems are drawn from. It is part of the autoscale range, so the
	 * line the stems grow from always stays in view.
	 */
	base: number;
	/**
	 * Width of the stem, in CSS pixels: at most half the bar spacing, so that
	 * neighboring stems never touch, and at least one device pixel.
	 */
	lineWidth: number;
	/**
	 * Diameter of the dot at the value, in CSS pixels, at most 20 and at most
	 * the bar spacing, so that neighboring dots never overlap. `0` draws no
	 * dots.
	 */
	markerSize: number;
}

export const defaultOptions: LollipopSeriesOptions = {
	...customSeriesDefaultOptions,
	base: 0,
	lineWidth: 2,
	markerSize: 8,
};
