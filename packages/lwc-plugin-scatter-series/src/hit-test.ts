import { markerDistance } from '@tradingview/lwc-toolkit/canvas/markers';

import type { ScatterShape } from './options';
import { cappedStrokeWidth } from './size';

/**
 * Where the points are, in CSS pixels, for hit testing. The arrays are indexed
 * by data index; `NaN` marks a point which is not drawn.
 */
export interface ScatterHitGeometry {
	/** Horizontal centres. */
	readonly xs: ArrayLike<number>;
	/** Vertical centres. */
	readonly ys: ArrayLike<number>;
	/** Half the drawn sizes, stroke included. */
	readonly radii: ArrayLike<number>;
	/** Marker shapes. */
	readonly shapes: readonly ScatterShape[];
	/** Data indices of the drawn points, in drawing order (bottom first). */
	readonly order: readonly number[];
	/** Width of the stroke around each point, CSS pixels, before the cap to a quarter of its size. */
	readonly strokeWidths: ArrayLike<number>;
}

/** A point under the cursor. */
export interface ScatterHit {
	/** Data index of the point. */
	index: number;
	/** Distance from the cursor to the edge of the point, `0` inside it. */
	distance: number;
}

/**
 * The point under `(x, y)`: the topmost point containing it — the hovered
 * point first, because it is drawn on top of all others, then the others in
 * reverse drawing order. When no point contains the cursor, the nearest point
 * within `tolerance` pixels, so that the smallest dots can still be hovered;
 * on a tie the upper one wins.
 *
 * Each point is tested as drawn: its shape, its size and its stroke capped
 * to a quarter of the size; the hovered point `hoveredSizeIncrease` pixels
 * larger.
 */
export function hitTestScatter(
	geometry: ScatterHitGeometry,
	x: number,
	y: number,
	hoveredIndex: number | null,
	tolerance: number,
	hoveredSizeIncrease: number
): ScatterHit | null {
	const { xs, ys, radii, shapes, order, strokeWidths } = geometry;
	const distanceOf = (index: number): number => {
		const px = xs[index];
		const py = ys[index];
		if (!Number.isFinite(px) || !Number.isFinite(py)) {
			return Number.POSITIVE_INFINITY;
		}
		const r = index === hoveredIndex ? radii[index] + hoveredSizeIncrease / 2 : radii[index];
		// Far enough that no shape can reach: skip the shape maths.
		if (Math.abs(x - px) > r + tolerance || Math.abs(y - py) > r + tolerance) {
			return Number.POSITIVE_INFINITY;
		}
		return markerDistance(shapes[index], x - px, y - py, r, cappedStrokeWidth(2 * r, strokeWidths[index]));
	};

	let best: ScatterHit | null = null;
	// A hovered point which is not drawn has no coordinates, and is not hit.
	if (hoveredIndex !== null && hoveredIndex < xs.length) {
		const distance = distanceOf(hoveredIndex);
		if (distance === 0) {
			return { index: hoveredIndex, distance };
		}
		if (distance <= tolerance) {
			best = { index: hoveredIndex, distance };
		}
	}
	for (let i = order.length - 1; i >= 0; i--) {
		const index = order[i];
		const distance = distanceOf(index);
		if (distance === 0) {
			return { index, distance };
		}
		if (distance <= tolerance && (best === null || distance < best.distance)) {
			best = { index, distance };
		}
	}
	return best;
}
