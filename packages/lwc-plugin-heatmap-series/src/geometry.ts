import { distanceToRange } from '@tradingview/lwc-toolkit/custom-series/hit-test';
import { isFiniteNumber } from '@tradingview/lwc-toolkit/numbers';

import { HeatmapCell } from './data';
import { HeatmapAmountRange } from './options';

/**
 * Whether a cell can be drawn: it is there, and its edges and its amount are
 * finite numbers. A `null` cell, as a JSON feed may send, is not drawn.
 */
export function isDrawnCell(cell: HeatmapCell | null | undefined): cell is HeatmapCell {
	return cell !== null && cell !== undefined
		&& isFiniteNumber(cell.low) && isFiniteNumber(cell.high) && isFiniteNumber(cell.amount);
}

/**
 * Whether a point has at least one cell that can be drawn. `cells` that is
 * missing, `null` or not an array has none.
 */
export function hasDrawnCell(cells: unknown): boolean {
	return Array.isArray(cells) && cells.some(isDrawnCell);
}

/**
 * The values the chart autoscales on: the lowest and the highest edge of the
 * column's drawn cells, whichever of `low` and `high` holds them, then the
 * middle of the two, which comes last and so is the value a price line would
 * show. `[NaN]` when no cell is drawn, which keeps the point out of the price
 * scale.
 */
export function heatmapPlotValues(cells: unknown): number[] {
	let low = Number.POSITIVE_INFINITY;
	let high = Number.NEGATIVE_INFINITY;
	if (Array.isArray(cells)) {
		for (const cell of cells as readonly (HeatmapCell | null)[]) {
			if (isDrawnCell(cell)) {
				low = Math.min(low, cell.low, cell.high);
				high = Math.max(high, cell.low, cell.high);
			}
		}
	}
	if (low > high) {
		return [Number.NaN];
	}
	return [low, high, low + (high - low) / 2];
}

/**
 * Widens `range` to take in the amounts of the drawn cells of a column, and
 * returns it; pass `null` to start a range. Still `null` when no cell is
 * drawn.
 */
export function addAmounts(range: HeatmapAmountRange | null, cells: readonly (HeatmapCell | null)[]): HeatmapAmountRange | null {
	let result = range;
	for (const cell of cells) {
		if (!isDrawnCell(cell)) {
			continue;
		}
		if (result === null) {
			result = { min: cell.amount, max: cell.amount };
		} else {
			result.min = Math.min(result.min, cell.amount);
			result.max = Math.max(result.max, cell.amount);
		}
	}
	return result;
}

/** A span in bitmap pixels, the end exclusive. */
export interface Span {
	position: number;
	length: number;
}

/**
 * The bitmap span between two media coordinates, in either order, with each
 * edge rounded on its own: two cells that share a price edge share a pixel
 * edge, so they abut with no seam and no overlap at any pixel ratio.
 */
export function edgeSpan(a: number, b: number, pixelRatio: number): Span {
	const start = Math.round(Math.min(a, b) * pixelRatio);
	const end = Math.round(Math.max(a, b) * pixelRatio);
	return { position: start, length: end - start };
}

/**
 * Whether a gap or a border `width` device pixels wide is drawn along a side
 * of a cell `size` device pixels long: the cell has to be more than three
 * times as long, so neither eats a small cell. `size` is the length before it
 * is rounded to pixels, so that cells of one size all get the gap or all go
 * without, however their edges round.
 */
export function fitsInside(size: number, width: number): boolean {
	return width > 0 && size > width * 3;
}

/**
 * A span with `gap` pixels taken off, half at each end, so that two spans
 * that abut end up `gap` pixels apart. Never shorter than a pixel.
 */
export function gapSpan(span: Span, gap: number): Span {
	if (gap <= 0) {
		return span;
	}
	return { position: span.position + Math.floor(gap / 2), length: Math.max(1, span.length - gap) };
}

/**
 * A span shrunk by `inset` pixels at each end, never to less than a pixel,
 * so a border never turns a cell's length negative.
 */
export function insetSpan(span: Span, inset: number): Span {
	if (inset <= 0) {
		return span;
	}
	return { position: span.position + inset, length: Math.max(1, span.length - inset * 2) };
}

/**
 * Index and distance of the drawn cell nearest to `y`, in media coordinates,
 * or `null` when no cell can be placed. `toY` converts a price to a y
 * coordinate, or returns `null` while it cannot. Inside a cell the distance
 * is `0`; of two cells at the same distance, the one listed later wins.
 */
export function nearestCell(
	cells: readonly (HeatmapCell | null)[],
	y: number,
	toY: (price: number) => number | null
): { index: number; distance: number } | null {
	let best: { index: number; distance: number } | null = null;
	cells.forEach((cell: HeatmapCell | null, index: number) => {
		if (!isDrawnCell(cell)) {
			return;
		}
		const lowY = toY(cell.low);
		const highY = toY(cell.high);
		if (lowY === null || highY === null) {
			return;
		}
		const distance = distanceToRange(y, lowY, highY);
		if (best === null || distance <= best.distance) {
			best = { index, distance };
		}
	});
	return best;
}
