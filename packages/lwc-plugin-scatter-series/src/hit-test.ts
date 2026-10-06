import type { ScatterShape } from './options';
import { markerVertices } from './shapes';
import { cappedStrokeWidth } from './size';

/** Default distance, in CSS pixels, within which a point is hit although the cursor is outside it. */
export const DEFAULT_HIT_TOLERANCE = 3;

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
	/**
	 * Width of the stroke around each point, CSS pixels, before the cap to a
	 * quarter of its size. No stroke when omitted.
	 */
	readonly strokeWidths?: ArrayLike<number>;
}

/** A point under the cursor. */
export interface ScatterHit {
	/** Data index of the point. */
	index: number;
	/** Distance from the cursor to the edge of the point, `0` inside it. */
	distance: number;
}

/** Distance from `(px, py)` to the segment from `(ax, ay)` to `(bx, by)`. */
function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
	const ex = bx - ax;
	const ey = by - ay;
	const length = ex * ex + ey * ey;
	const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * ex + (py - ay) * ey) / length));
	return Math.hypot(px - (ax + t * ex), py - (ay + t * ey));
}

/** Distance from `(dx, dy)` to a convex polygon of radius `r` centred on the origin, `0` inside it. */
function polygonDistance(vertices: readonly number[], dx: number, dy: number, r: number): number {
	const count = vertices.length / 2;
	let side = 0;
	let inside = true;
	let nearest = Number.POSITIVE_INFINITY;
	for (let i = 0; i < count; i++) {
		const j = (i + 1) % count;
		const ax = vertices[2 * i] * r;
		const ay = vertices[2 * i + 1] * r;
		const bx = vertices[2 * j] * r;
		const by = vertices[2 * j + 1] * r;
		const cross = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
		if (cross !== 0) {
			const sign = Math.sign(cross);
			if (side === 0) {
				side = sign;
			} else if (sign !== side) {
				inside = false;
			}
		}
		nearest = Math.min(nearest, segmentDistance(dx, dy, ax, ay, bx, by));
	}
	return inside ? 0 : nearest;
}

/**
 * Distance from an offset `(dx, dy)` relative to the centre of a marker to the
 * outer edge of the marker as drawn, `0` inside: the outline of radius
 * `r − strokeWidth / 2` the renderer traces, widened by half the stroke.
 *
 * @param shape - The marker shape.
 * @param dx - Horizontal offset from the centre, CSS pixels.
 * @param dy - Vertical offset from the centre, CSS pixels (down is positive).
 * @param r - Half the drawn size, stroke included.
 * @param strokeWidth - Width of the stroke around the marker.
 */
export function shapeDistance(shape: ScatterShape, dx: number, dy: number, r: number, strokeWidth: number = 0): number {
	const halfStroke = Math.max(0, Math.min(strokeWidth / 2, r));
	const outline = r - halfStroke;
	let distance: number;
	if (shape === 'square') {
		distance = Math.hypot(Math.max(0, Math.abs(dx) - outline), Math.max(0, Math.abs(dy) - outline));
	} else {
		const vertices = markerVertices(shape);
		distance = vertices === null
			? Math.max(0, Math.hypot(dx, dy) - outline)
			: polygonDistance(vertices, dx, dy, outline);
	}
	return Math.max(0, distance - halfStroke);
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
	tolerance: number = DEFAULT_HIT_TOLERANCE,
	hoveredSizeIncrease: number = 0
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
		const strokeWidth = strokeWidths !== undefined ? cappedStrokeWidth(2 * r, strokeWidths[index]) : 0;
		return shapeDistance(shapes[index], x - px, y - py, r, strokeWidth);
	};

	let best: ScatterHit | null = null;
	if (hoveredIndex !== null && order.indexOf(hoveredIndex) !== -1) {
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
