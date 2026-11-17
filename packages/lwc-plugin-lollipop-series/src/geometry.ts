import { finiteOr, nonNegativeOr } from '@tradingview/lwc-toolkit/numbers';

import { LollipopSeriesOptions, defaultOptions } from './options';

/**
 * The largest dot diameter drawn, in CSS pixels. Autoscale only knows the
 * values, so a dot at the highest or lowest one sticks out by its radius;
 * keeping it this small keeps it within the price scale's default margins in
 * a pane at least 100 px tall.
 */
export const MAX_MARKER_SIZE = 20;

/** The `base` option, or `0` when it is not a finite number. */
export function lollipopBase(options: Pick<LollipopSeriesOptions, 'base'>): number {
	return finiteOr(options.base, defaultOptions.base);
}

/** Stem width and dot radius of every lollipop at one bar spacing, in CSS pixels. */
export interface LollipopSizes {
	lineWidth: number;
	dotRadius: number;
}

/**
 * The stem width and dot radius to draw at a bar spacing: the options, capped
 * so that a stem is at most half the bar spacing wide and a dot at most
 * `MAX_MARKER_SIZE` and at most the bar spacing across. A size which is not a
 * finite number falls back to its default. The renderer keeps every stem at
 * least one device pixel wide.
 */
export function lollipopSizes(
	options: Pick<LollipopSeriesOptions, 'lineWidth' | 'markerSize'>,
	barSpacing: number
): LollipopSizes {
	const markerSize = nonNegativeOr(options.markerSize, defaultOptions.markerSize);
	return {
		lineWidth: Math.min(nonNegativeOr(options.lineWidth, defaultOptions.lineWidth), barSpacing / 2),
		dotRadius: Math.min(markerSize, MAX_MARKER_SIZE, barSpacing) / 2,
	};
}
