import { IRange } from 'lightweight-charts';

import { SeriesDataPoint } from './types';

/**
 * Maps a data point to its index on the chart's shared time scale. A series' own
 * data indices need not match the scale (a series can start later or skip
 * points), so every viewport comparison goes through this mapping. Returns `null`
 * when the point cannot be placed.
 */
export type LogicalIndexOf = (point: SeriesDataPoint) => number | null;

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/** Index of the first point whose logical index is >= `target` (`points.length` when none is). */
export function lowerBoundByLogical(
	points: readonly SeriesDataPoint[],
	target: number,
	logicalIndexOf: LogicalIndexOf
): number {
	let low = 0;
	let high = points.length;
	while (low < high) {
		const mid = (low + high) >> 1;
		const logical = logicalIndexOf(points[mid]);
		if (logical !== null && logical < target) {
			low = mid + 1;
		} else {
			high = mid;
		}
	}
	return low;
}

/** Index of the point closest (by logical index) to `target`; `points` must be non-empty. */
export function nearestIndexByLogical(
	points: readonly SeriesDataPoint[],
	target: number,
	logicalIndexOf: LogicalIndexOf
): number {
	const last = points.length - 1;
	const upper = lowerBoundByLogical(points, target, logicalIndexOf);
	if (upper <= 0) {
		return 0;
	}
	if (upper > last) {
		return last;
	}
	const before = logicalIndexOf(points[upper - 1]);
	const after = logicalIndexOf(points[upper]);
	if (before === null || after === null) {
		return upper;
	}
	return target - before <= after - target ? upper - 1 : upper;
}

/** The `points` slice bounds inside `range`, or `null` when nothing is visible. */
export function visibleBounds(
	points: readonly SeriesDataPoint[],
	range: IRange<number> | null,
	logicalIndexOf: LogicalIndexOf
): { from: number; to: number } | null {
	const last = points.length - 1;
	if (!range || last < 0) {
		return null;
	}
	const from = lowerBoundByLogical(points, Math.ceil(range.from), logicalIndexOf);
	// Last point whose logical index is <= floor(range.to).
	const to = lowerBoundByLogical(points, Math.floor(range.to) + 1, logicalIndexOf) - 1;
	// `from > last`: every point is left of the viewport; `to < from`: every
	// point is right of it. Both mean nothing is visible – do not clamp the
	// result into a fake one-point range.
	if (from > last || to < from) {
		return null;
	}
	return { from, to };
}

/** Index of the first point at or after the start of `range` (0 when unknown). */
export function firstVisibleIndex(
	points: readonly SeriesDataPoint[],
	range: IRange<number> | null,
	logicalIndexOf: LogicalIndexOf
): number {
	if (!range || points.length === 0) {
		return 0;
	}
	return clamp(
		lowerBoundByLogical(points, Math.ceil(range.from), logicalIndexOf),
		0,
		points.length - 1
	);
}

/**
 * The visible logical range that brings the point at `activeIndex` on screen, or
 * `null` when it already is (or cannot be placed). The window is nudged by the
 * smallest amount that reveals the point – rather than recentring it – so
 * stepping past an edge scrolls smoothly.
 */
export function scrollIntoViewRange(
	points: readonly SeriesDataPoint[],
	activeIndex: number,
	range: IRange<number> | null,
	logicalIndexOf: LogicalIndexOf
): IRange<number> | null {
	const point = points[activeIndex];
	if (!range || !point) {
		return null;
	}
	const index = logicalIndexOf(point);
	if (index === null) {
		return null;
	}
	const span = range.to - range.from;
	// Keep a one-point margin from the edge (when the window is wide enough) so
	// the following point is already visible after a step.
	const margin = span > 4 ? 1 : 0;
	let from: number;
	if (index < range.from + margin) {
		from = index - margin;
	} else if (index > range.to - margin) {
		from = index - span + margin;
	} else {
		return null; // already comfortably within view
	}
	const lastLogical = logicalIndexOf(points[points.length - 1]) ?? index;
	from = clamp(from, 0, Math.max(0, lastLogical));
	return { from, to: from + span };
}

/**
 * The visible logical range after a `+` / `-` zoom step. `anchorLogical` is kept
 * at the same position on screen so the user does not lose their place; pass
 * `null` to anchor on the viewport centre. Returns `null` when there is nothing
 * to zoom.
 */
export function zoomRange(
	range: IRange<number> | null,
	anchorLogical: number | null,
	zoomIn: boolean,
	zoomStep: number,
	minZoomSpan: number
): IRange<number> | null {
	if (!range) {
		return null;
	}
	const span = range.to - range.from;
	if (span <= 0) {
		return null;
	}
	const newSpan = Math.max(minZoomSpan, span * (zoomIn ? 1 - zoomStep : 1 + zoomStep));
	const anchor = anchorLogical ?? (range.from + range.to) / 2;
	const ratio = (anchor - range.from) / span;
	const from = anchor - ratio * newSpan;
	return { from, to: from + newSpan };
}
