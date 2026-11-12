import { Time } from 'lightweight-charts';
import {
	BitmapCoordinatesRenderingScope,
	CustomSeriesDrawArgs,
	CustomSeriesRendererBase,
} from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { effectiveBarSpacing, forEachVisibleBar, getConflationFactor } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { fullBarWidthAfter } from '@tradingview/lwc-toolkit/dimensions/full-width';
import { clampOpacity, finiteOr } from '@tradingview/lwc-toolkit/numbers';

import { Rgba, mixColors, normalizeCssColor, parseNormalizedColor, shadeRatio } from './color';
import { BackgroundShadeData } from './data';
import { BackgroundShadeSeriesOptions, defaultOptions } from './options';

/** The shades between the two end colors, for the option values they were built from. */
interface Palette {
	lowColor: string;
	highColor: string;
	/** `SHADE_STEPS` colors, from `lowColor` at the first to `highColor` at the last. */
	shades: readonly string[];
}

/**
 * How many shades a palette holds. Each bar takes the nearest one, so no
 * color string is built while drawing, and neighboring values a step apart
 * share a fill.
 */
const SHADE_STEPS = 256;

/** How many point colors the renderer remembers the validity of. */
const VALID_COLORS_CACHE_SIZE = 256;

/**
 * Parses a CSS color through the canvas. Returns `null` for an invalid color,
 * and for a color the canvas keeps in another color space, such as `oklch()`.
 */
function parseCssColor(color: string): Rgba | null {
	const normalized = normalizeCssColor(color);
	return normalized === null ? null : parseNormalizedColor(normalized);
}

export class BackgroundShadeSeriesRenderer<
	HorzScaleItem = Time,
	TData extends BackgroundShadeData<HorzScaleItem> = BackgroundShadeData<HorzScaleItem>
> extends CustomSeriesRendererBase<HorzScaleItem, TData, BackgroundShadeSeriesOptions> {
	private _palette: Palette | null = null;
	/** Whether the canvas accepts a point color, by color string. */
	private readonly _validColors = new Map<string, boolean>();

	protected drawImpl(
		scope: BitmapCoordinatesRenderingScope,
		{ data, options }: CustomSeriesDrawArgs<HorzScaleItem, TData, BackgroundShadeSeriesOptions>
	): void {
		const { context: ctx, horizontalPixelRatio, bitmapSize } = scope;
		ctx.save();
		const shades = this._resolvePalette(options).shades;
		const lowValue = finiteOr(options.lowValue, defaultOptions.lowValue);
		const highValue = finiteOr(options.highValue, defaultOptions.highValue);
		// A conflated bar stands for several, so its column is as wide as their
		// slots together, centered where the chart places the bar.
		const halfSpacing = effectiveBarSpacing(data) / 2;
		const stride = getConflationFactor(data);
		ctx.globalAlpha = clampOpacity(options.opacity, defaultOptions.opacity);
		let lastFill = '';
		let previousTime = Number.NaN;
		let previousRight: number | null = null;
		forEachVisibleBar(data, bar => {
			// A point's own color reaches the renderer as `barColor`, which is the
			// series color for a point without one: the chart keeps `color` out of
			// `originalData`. The chart hands over no whitespace, so every value is
			// finite.
			const fill = bar.barColor !== options.color && this._isValidColor(bar.barColor)
				? bar.barColor
				: shades[Math.round(shadeRatio(bar.originalData.value, lowValue, highValue) * (SHADE_STEPS - 1))];
			// A bar right after the previous one starts where that one ended, so
			// the shared edge is rounded once and leaves no seam. A conflated bar
			// is indexed by its first point, so after whitespace two neighbors
			// can be closer than the conflation factor: any bar within it counts.
			const column = fullBarWidthAfter(
				bar.time <= previousTime + stride ? previousRight : null,
				bar.x,
				halfSpacing,
				horizontalPixelRatio
			);
			previousTime = bar.time;
			previousRight = column.position + column.length;
			if (fill !== lastFill) {
				ctx.fillStyle = fill;
				lastFill = fill;
			}
			ctx.fillRect(column.position, 0, column.length, bitmapSize.height);
		});
		ctx.restore();
	}

	/**
	 * Whether the canvas accepts a point color. An invalid one would be ignored
	 * by `fillStyle` and leave the previous bar's fill in place, so such a bar
	 * is shaded from its value instead. The answers are remembered for the
	 * first colors seen, up to a limit, so that colors computed per point cannot
	 * grow the cache without bound.
	 */
	private _isValidColor(color: string): boolean {
		let valid = this._validColors.get(color);
		if (valid === undefined) {
			valid = normalizeCssColor(color) !== null;
			if (this._validColors.size < VALID_COLORS_CACHE_SIZE) {
				this._validColors.set(color, valid);
			}
		}
		return valid;
	}

	/**
	 * The shades between the end colors, built again only when the options name
	 * other colors. A color the canvas cannot parse falls back to the default.
	 */
	private _resolvePalette(options: BackgroundShadeSeriesOptions): Palette {
		const palette = this._palette;
		if (palette !== null && palette.lowColor === options.lowColor && palette.highColor === options.highColor) {
			return palette;
		}
		const parse = (color: string, fallback: string): Rgba =>
			parseCssColor(color) ?? parseCssColor(fallback) ?? [0, 0, 0, 0];
		const low = parse(options.lowColor, defaultOptions.lowColor);
		const high = parse(options.highColor, defaultOptions.highColor);
		this._palette = {
			lowColor: options.lowColor,
			highColor: options.highColor,
			shades: Array.from({ length: SHADE_STEPS }, (_: unknown, i: number) => mixColors(low, high, i / (SHADE_STEPS - 1))),
		};
		return this._palette;
	}
}
