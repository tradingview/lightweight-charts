import { CustomBarItemData, CustomData, PaneRendererCustomData } from 'lightweight-charts';

import { isFiniteNumber } from '../numbers.js';

/**
 * Distance from `value` to the closed range between `a` and `b`, which may be
 * given in either order: `0` inside it.
 */
export function distanceToRange(value: number, a: number, b: number): number {
	const low = a < b ? a : b;
	const high = a < b ? b : a;
	if (value < low) {
		return low - value;
	}
	if (value > high) {
		return value - high;
	}
	return 0;
}

/**
 * The series' `hitTestTolerance` option, in CSS pixels: how far from an
 * item's geometry the pointer still hovers it. The option exists from 5.2,
 * the first version that calls `hitTest`; `fallback` stands in when it is
 * missing or is not a finite, non-negative number.
 */
export function seriesHitTestTolerance(options: object, fallback: number = 8): number {
	const tolerance = (options as { hitTestTolerance?: unknown }).hitTestTolerance;
	return isFiniteNumber(tolerance) && tolerance >= 0 ? tolerance : fallback;
}

/**
 * The vertical extent of a bar's hit geometry, in media coordinates, with its
 * two ends in either order.
 */
export type VerticalSpan = readonly [number, number];

/** The bar {@link nearestBar} or {@link nearestVerticalRange} found, and how far the pointer is from it. */
export interface NearestBarHit {
	/** Index of the bar in `data.bars`. */
	index: number;
	/** Distance from the pointer to the bar's geometry, in CSS pixels; `0` inside it. */
	distance: number;
}

/**
 * Finds the visible bar closest to the pointer, for a renderer's `hitTest`
 * over any geometry. `distance(bar, index)` measures from the pointer to what
 * the bar draws, or returns `null` for a bar with nothing to hit, and the
 * nearest bar within `tolerance` wins; of two at the same distance, the
 * earlier one.
 *
 * Only the bars whose `x` is within `reach` of the pointer's `x` are measured,
 * found by binary search, so the cost does not grow with the number of bars on
 * screen. `reach` has to cover the widest a bar's geometry gets from its `x`,
 * plus `tolerance`.
 */
export function nearestBar<HorzScaleItem, TData extends CustomData<HorzScaleItem>>(
	data: PaneRendererCustomData<HorzScaleItem, TData>,
	x: number,
	reach: number,
	tolerance: number,
	distance: (bar: CustomBarItemData<HorzScaleItem, TData>, index: number) => number | null
): NearestBarHit | null {
	const range = data.visibleRange;
	if (range === null) {
		return null;
	}
	const bars = data.bars;
	const to = Math.min(range.to, bars.length);
	let best: NearestBarHit | null = null;
	for (let index = firstBarAtOrAfter(bars, Math.max(0, range.from), to, x - reach); index < to; index++) {
		const bar = bars[index];
		if (bar.x > x + reach) {
			break;
		}
		const measured = distance(bar, index);
		if (measured !== null && measured <= tolerance && (best === null || measured < best.distance)) {
			best = { index, distance: measured };
		}
	}
	return best;
}

/**
 * Finds the visible bar closest to the pointer, for a renderer's `hitTest`
 * over bars that each cover a vertical range: a column, a candle, a stem. A
 * bar's box is `halfWidth` either side of its `x`, between the two ends `span`
 * returns for it, and the pointer hits it when the straight-line distance to
 * the box is at most `tolerance`. `span` returns `null` for a bar with nothing
 * to hit, such as one whose value is off the price scale. Of two bars at the
 * same distance, the earlier one wins. Built on {@link nearestBar}.
 */
export function nearestVerticalRange<HorzScaleItem, TData extends CustomData<HorzScaleItem>>(
	data: PaneRendererCustomData<HorzScaleItem, TData>,
	x: number,
	y: number,
	halfWidth: number,
	tolerance: number,
	span: (bar: CustomBarItemData<HorzScaleItem, TData>, index: number) => VerticalSpan | null
): NearestBarHit | null {
	return nearestBar(data, x, halfWidth + tolerance, tolerance, (bar, index) => {
		const dx = distanceToRange(x, bar.x - halfWidth, bar.x + halfWidth);
		if (dx > tolerance) {
			return null;
		}
		const extent = span(bar, index);
		if (extent === null) {
			return null;
		}
		const dy = distanceToRange(y, extent[0], extent[1]);
		return Math.sqrt(dx * dx + dy * dy);
	});
}

/** The first index in `[from, to)` whose bar has `x >= minX`; `to` when there is none. */
function firstBarAtOrAfter(bars: readonly { x: number }[], from: number, to: number, minX: number): number {
	let lo = from;
	let hi = to;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (bars[mid].x < minX) {
			lo = mid + 1;
		} else {
			hi = mid;
		}
	}
	return lo;
}

/**
 * Keeps the `hitTestData` of the hovered item, so that `hitTest` returns the
 * same object while the same item stays hovered. The chart compares
 * `hitTestData` by reference and repaints the pane whenever it changes: a new
 * object on every pointer move would repaint on every move.
 */
export interface HitTestDataCache<T> {
	/**
	 * The data kept for `key` when it is the key asked for last; otherwise
	 * `create()`, which is kept in its place. Derive the data from the key
	 * alone, or call {@link clear} when the series' data changes.
	 */
	get(key: string | number, create: () => T): T;
	/** Forgets the kept data. */
	clear(): void;
}

/** Creates a {@link HitTestDataCache} holding the data of one item at a time. */
export function createHitTestDataCache<T>(): HitTestDataCache<T> {
	let entry: { key: string | number; value: T } | null = null;
	return {
		get(key: string | number, create: () => T): T {
			if (entry === null || entry.key !== key) {
				entry = { key, value: create() };
			}
			return entry.value;
		},
		clear(): void {
			entry = null;
		},
	};
}
