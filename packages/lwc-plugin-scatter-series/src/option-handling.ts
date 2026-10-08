import type { AutoscaleInfoProvider, CustomSeriesOptions, SeriesPartialOptions } from 'lightweight-charts';
import { clampOpacity, nonNegativeOr } from '@tradingview/lwc-toolkit/numbers';
import { isUnsafeKey, mergeOptions } from '@tradingview/lwc-toolkit/options/merge';

import {
	ScatterOnlyOptions,
	ScatterSeriesOptions,
	ScatterSeriesPartialOptions,
	scatterOptionDefaults,
	scatterOptionKeys,
	underlyingSeriesDefaults,
} from './options';
import type { ScatterRenderOptions } from './renderer';

/*
 How a scatter series takes its options. It keeps the scatter options itself,
 and two of the series options: `hitTestTolerance`, which the renderer uses
 (the underlying series has the chart's own hit test turned off), and
 `autoscaleInfoProvider`, which the series' own provider wraps. Every other
 series option goes to the underlying series.
 */

/** Scatter options which change how the series is painted, but not its points or its slots. */
const PAINT_ONLY_KEYS: ReadonlySet<string> = new Set([
	'hoveredOpacity',
	'hoveredSizeIncrease',
	'hoveredRingWidth',
	'hoveredRingColor',
	'hoveredRingGap',
	'plotBorder',
]);

/** Scatter options which change how the points look, but neither the slots nor the X axis. */
const RESTYLE_KEYS: ReadonlySet<string> = new Set([
	'opacity',
	'pointSize',
	'pointSizeLimits',
	'shape',
	'strokeColor',
	'strokeWidth',
	'hollow',
	'palette',
	'sizeRange',
	'sizeDomain',
	'sizeScale',
]);

/** The options a scatter series keeps itself. Replaced as a whole on every change. */
export interface ScatterOwnOptions {
	/** The options a scatter series adds to `CustomSeriesOptions`. */
	readonly scatter: ScatterOnlyOptions;
	/** `hitTestTolerance`, at least `0`. */
	readonly tolerance: number;
	/** The user's `autoscaleInfoProvider`. */
	readonly autoscale: AutoscaleInfoProvider | undefined;
}

/** Options as `applyOptions` takes them, split by where they go. */
export interface SplitOptions {
	/** Scatter options; a top-level `null` is the default already. */
	scatter: Record<string, unknown>;
	/** The options of the underlying series. */
	base: SeriesPartialOptions<CustomSeriesOptions>;
	/** The new `hitTestTolerance`, or `null` when none is given. */
	tolerance: number | null;
	/** The new `autoscaleInfoProvider`, `undefined` included, or `null` when none is given. */
	autoscale: { provider: AutoscaleInfoProvider | undefined } | null;
}

/**
 * Splits options into the scatter ones and the series ones. `null` for a
 * scatter option whose default is not `null` (an object, an array, a number)
 * is its default.
 */
export function splitOptions(options: ScatterSeriesPartialOptions): SplitOptions {
	const scatter: Record<string, unknown> = {};
	const base: Record<string, unknown> = {};
	const defaults = scatterOptionDefaults as Record<string, unknown>;
	let tolerance: number | null = null;
	let autoscale: SplitOptions['autoscale'] = null;
	for (const [key, value] of Object.entries(options)) {
		if (isUnsafeKey(key)) {
			continue;
		}
		if (scatterOptionKeys.has(key)) {
			scatter[key] = value === null && defaults[key] !== null ? defaults[key] : value;
		} else if (key === 'hitTestTolerance') {
			if (typeof value === 'number' && Number.isFinite(value)) {
				tolerance = Math.max(0, value);
			}
		} else if (key === 'autoscaleInfoProvider') {
			autoscale = { provider: value as AutoscaleInfoProvider | undefined };
		} else {
			base[key] = value;
		}
	}
	return { scatter, base: base as SeriesPartialOptions<CustomSeriesOptions>, tolerance, autoscale };
}

/** The options of a new series. */
export function initialOwnOptions(split: SplitOptions): ScatterOwnOptions {
	return {
		scatter: mergeOptions(scatterOptionDefaults, split.scatter),
		tolerance: split.tolerance ?? underlyingSeriesDefaults.hitTestTolerance,
		autoscale: split.autoscale?.provider,
	};
}

/** `own` with the options of `split` applied: nested objects merged, arrays and functions replaced. */
export function applyOwnOptions(own: ScatterOwnOptions, split: SplitOptions): ScatterOwnOptions {
	return {
		scatter: Object.keys(split.scatter).length > 0 ? mergeOptions(own.scatter, split.scatter) : own.scatter,
		tolerance: split.tolerance ?? own.tolerance,
		autoscale: split.autoscale !== null ? split.autoscale.provider : own.autoscale,
	};
}

/**
 * What a change of options changes: the slots or the X axis (`axis`), the
 * look of the points (`style`: the model is built again, the axis stays), or
 * neither (`paint`).
 */
export function optionChange(split: SplitOptions): 'axis' | 'style' | 'paint' {
	const keys = Object.keys(split.scatter);
	if (keys.some((key: string) => !PAINT_ONLY_KEYS.has(key) && !RESTYLE_KEYS.has(key))) {
		return 'axis';
	}
	return split.base.color !== undefined || keys.some((key: string) => RESTYLE_KEYS.has(key)) ? 'style' : 'paint';
}

/** Every option of a series: those of the underlying series (`base`, with `color`) and its own. */
export function fullOptions(base: CustomSeriesOptions, color: string, own: ScatterOwnOptions): ScatterSeriesOptions {
	return {
		...base,
		color,
		hitTestTolerance: own.tolerance,
		autoscaleInfoProvider: own.autoscale,
		...own.scatter,
	};
}

/** The options the renderer draws and hit tests with, checked. */
export function paintOptions(own: ScatterOwnOptions): ScatterRenderOptions {
	const options = own.scatter;
	return {
		hoveredOpacity: clampOpacity(options.hoveredOpacity, scatterOptionDefaults.hoveredOpacity),
		hoveredSizeIncrease: nonNegativeOr(options.hoveredSizeIncrease, 0),
		hoveredRingWidth: nonNegativeOr(options.hoveredRingWidth, 0),
		hoveredRingColor: options.hoveredRingColor ?? null,
		hoveredRingGap: nonNegativeOr(options.hoveredRingGap, scatterOptionDefaults.hoveredRingGap),
		plotBorder: options.plotBorder,
		baselines: options.baselines,
		hitTestTolerance: own.tolerance,
	};
}

/**
 * Applies options to the underlying series, all or nothing: should the chart
 * refuse them, the series takes back the options it had, as far as the chart
 * lets it, and the error is thrown on.
 */
export function applySeriesOptions(
	series: { options(): Readonly<CustomSeriesOptions>; applyOptions(options: SeriesPartialOptions<CustomSeriesOptions>): void },
	base: SeriesPartialOptions<CustomSeriesOptions>
): void {
	const keys = Object.keys(base);
	if (keys.length === 0) {
		return;
	}
	const current = series.options() as unknown as Record<string, unknown>;
	const previous: Record<string, unknown> = {};
	for (const key of keys) {
		previous[key] = current[key];
	}
	try {
		series.applyOptions(base);
	} catch (error) {
		try {
			series.applyOptions(previous as SeriesPartialOptions<CustomSeriesOptions>);
		} catch {
			// Nothing more to restore.
		}
		throw error;
	}
}
