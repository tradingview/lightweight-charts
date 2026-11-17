import { finiteOr, isFiniteNumber } from '@tradingview/lwc-toolkit/numbers';

import { Rgba, mixColors, parseCssColor } from './color';
import { HeatmapAmountRange, HeatmapCellShader } from './options';

/** Options of {@link createColorScale}. */
export interface ColorScaleOptions {
	/**
	 * The colors of the scale, from the low end to the high end, spread evenly
	 * between them: any CSS color the canvas accepts. A stop the canvas cannot
	 * parse, or keeps in a color space other than sRGB such as `oklch()`, is
	 * left out; with none left, every cell is transparent. Without a DOM, as in
	 * server-side rendering, only `#rrggbb`, `rgb()` and `rgba()` stops are
	 * read.
	 */
	stops: readonly string[];
	/**
	 * The amounts that take the first and the last stop; an amount beyond
	 * either takes the color at that end. A domain given high end first
	 * reverses the scale, and one whose ends are not both finite numbers is
	 * ignored. Defaults to the range of the amounts in view, which the series
	 * hands the shader on every paint.
	 */
	domain?: readonly [number, number];
	/**
	 * How many colors the scale holds, from `2` to `1024`, rounded. Each
	 * amount takes the nearest one, so the fewer there are, the more cells the
	 * series fills together. Defaults to `32`.
	 */
	steps?: number;
}

const DEFAULT_STEPS = 32;
const MAX_STEPS = 1024;

/**
 * Where `value` sits between `low` and `high`, as a ratio clamped to `0`–`1`.
 * When the two are equal, a value below them is `0` and any other `1`. A
 * value that is not a number is `0`.
 */
export function amountRatio(value: number, low: number, high: number): number {
	if (Number.isNaN(value)) {
		return 0;
	}
	if (low === high) {
		return value < low ? 0 : 1;
	}
	const ratio = (value - low) / (high - low);
	return ratio > 0 ? Math.min(1, ratio) : 0;
}

/** The color `ratio` of the way along `stops`, which are evenly spaced. */
function colorAlong(stops: readonly Rgba[], ratio: number): string {
	if (stops.length === 1) {
		return mixColors(stops[0], stops[0], 0);
	}
	const position = ratio * (stops.length - 1);
	const index = Math.min(Math.floor(position), stops.length - 2);
	return mixColors(stops[index], stops[index + 1], position - index);
}

/**
 * Builds a `cellShader` that maps amounts onto a scale of colors, for
 * example from a faint to a strong color, or through several:
 *
 * ```js
 * createHeatmapSeries(chart, {
 *     cellShader: createColorScale({ stops: ['rgba(41, 98, 255, 0.1)', '#2962FF', '#F23645'] }),
 * });
 * ```
 *
 * The colors are worked out once, as `steps` color strings, and every amount
 * takes the nearest, so the shader builds no string while drawing and cells
 * with nearby amounts share a fill.
 */
export function createColorScale(options: ColorScaleOptions): HeatmapCellShader {
	const steps = Math.min(MAX_STEPS, Math.max(2, Math.round(finiteOr(options.steps, DEFAULT_STEPS))));
	const stops = options.stops.map(parseCssColor).filter((stop: Rgba | null): stop is Rgba => stop !== null);
	const colors = Array.from({ length: steps }, (_: unknown, i: number) =>
		(stops.length === 0 ? 'transparent' : colorAlong(stops, i / (steps - 1)))
	);
	const domain = options.domain;
	// A copy, so that changing the array afterwards does not change the scale.
	const fixed: readonly [number, number] | null =
		domain !== undefined && isFiniteNumber(domain[0]) && isFiniteNumber(domain[1]) ? [domain[0], domain[1]] : null;
	return (amount: number, range: HeatmapAmountRange): string => {
		const low = fixed === null ? range.min : fixed[0];
		const high = fixed === null ? range.max : fixed[1];
		return colors[Math.round(amountRatio(amount, low, high) * (steps - 1))];
	};
}
