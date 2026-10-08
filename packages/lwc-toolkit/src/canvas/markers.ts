/**
 * The shape of a point marker of a given radius. Every shape fits the square
 * of side `2 × radius` around its centre: the circle and the diamond touch
 * its sides, while the corners of the square and the base corners of the
 * triangles are its corners, `√2 × radius` from the centre.
 */
export type MarkerShape = 'circle' | 'square' | 'diamond' | 'triangleUp' | 'triangleDown';

/**
 * The part of a canvas path a marker is traced with: a
 * `CanvasRenderingContext2D` or a `Path2D` will do.
 */
export type MarkerPath = Pick<CanvasPath, 'arc' | 'closePath' | 'lineTo' | 'moveTo'>;

/*
 The polygons, as `[x0, y0, x1, y1, …]` for a marker of radius 1 centred on
 the origin, y pointing down, every one clockwise on screen. Drawing, the
 outline offset and the hit test all read these, so a marker is hit where it
 is drawn.
 */
const SQUARE: readonly number[] = [-1, -1, 1, -1, 1, 1, -1, 1];
const DIAMOND: readonly number[] = [0, -1, 1, 0, 0, 1, -1, 0];
const TRIANGLE_UP: readonly number[] = [0, -1, 1, 1, -1, 1];
const TRIANGLE_DOWN: readonly number[] = [0, 1, -1, -1, 1, -1];

/**
 * The vertices of a polygonal marker of radius 1 centred on the origin, as
 * `[x0, y0, x1, y1, …]`, clockwise on screen (y pointing down); `null` for a
 * circle. Scale by the radius and add the centre to place them.
 */
export function markerVertices(shape: MarkerShape): readonly number[] | null {
	switch (shape) {
		case 'square':
			return SQUARE;
		case 'diamond':
			return DIAMOND;
		case 'triangleUp':
			return TRIANGLE_UP;
		case 'triangleDown':
			return TRIANGLE_DOWN;
		default:
			return null;
	}
}

/**
 * Adds the outline of a marker of `radius` centred on `(x, y)` to the path as
 * a subpath of its own, which ends where it starts, leaving the path to be
 * filled or stroked. Several markers can be traced into one path and filled
 * or stroked at once: no line joins them. Use the same coordinate space
 * throughout: bitmap pixels in a bitmap-space renderer.
 *
 * A stroke is centred on the outline, so to draw a marker whose outer edge is
 * `radius` with a stroke `w` wide, trace it at `radius − w / 2` (see
 * {@link markerDistance}, which measures the marker drawn that way).
 *
 * @param emptyPath - pass `true` when the path holds nothing else (just after
 * `beginPath()`, or a new `Path2D`) and nothing will be added to it: a circle
 * is then traced with `arc` alone. Chromium draws a path of one such circle as
 * an exact oval, whose edge pixels differ slightly from those of the same
 * circle begun with `moveTo`, so a renderer which used to call `arc` keeps its
 * pixels. Polygons are traced the same either way.
 */
export function traceMarker(
	path: MarkerPath,
	shape: MarkerShape,
	x: number,
	y: number,
	radius: number,
	emptyPath: boolean = false
): void {
	const vertices = markerVertices(shape);
	if (vertices === null) {
		traceCircle(path, x, y, radius, emptyPath);
		return;
	}
	path.moveTo(x + vertices[0] * radius, y + vertices[1] * radius);
	for (let i = 2; i < vertices.length; i += 2) {
		path.lineTo(x + vertices[i] * radius, y + vertices[i + 1] * radius);
	}
	path.closePath();
}

/** A circle as a subpath of its own: begun with `moveTo`, unless the path is empty (see {@link traceMarker}). */
function traceCircle(path: MarkerPath, x: number, y: number, radius: number, emptyPath: boolean): void {
	if (!emptyPath) {
		// Where the arc starts: without it, `arc` joins the previous subpath with a line.
		path.moveTo(x + radius, y);
	}
	path.arc(x, y, radius, 0, 2 * Math.PI);
}

/**
 * Adds to the path, as a subpath of its own, the outline `offset` outside a
 * marker of `radius` centred on `(x, y)`: a circle `offset` larger, or the
 * polygon with every side moved `offset` outwards and its corners rounded —
 * the outer edge of the polygon stroked `2 × offset` wide with round joins.
 * Stroked `w` wide, it draws a ring of even width `w` at an even distance
 * `offset − w / 2` from the marker on every side: a hover ring or a selection
 * halo. `emptyPath` is that of {@link traceMarker}.
 */
export function traceMarkerOffset(
	path: MarkerPath,
	shape: MarkerShape,
	x: number,
	y: number,
	radius: number,
	offset: number,
	emptyPath: boolean = false
): void {
	const vertices = markerVertices(shape);
	if (vertices === null) {
		traceCircle(path, x, y, radius + offset, emptyPath);
		return;
	}
	const count = vertices.length / 2;
	// The outward normal of the side from vertex i to vertex i + 1, as an angle.
	const normal = (i: number): number => {
		const j = (i + 1) % count;
		const ex = vertices[2 * j] - vertices[2 * i];
		const ey = vertices[2 * j + 1] - vertices[2 * i + 1];
		// Clockwise on screen, the outside is on the left of each side.
		return Math.atan2(-ex, ey);
	};
	for (let i = 0; i < count; i++) {
		const vx = x + vertices[2 * i] * radius;
		const vy = y + vertices[2 * i + 1] * radius;
		const start = normal((i + count - 1) % count);
		if (i === 0) {
			// Where the first arc starts: without it, `arc` joins the previous subpath with a line.
			path.moveTo(vx + offset * Math.cos(start), vy + offset * Math.sin(start));
		}
		// From the side arriving at the vertex to the side leaving it: the
		// straight line from the previous arc is the side moved outwards.
		path.arc(vx, vy, offset, start, normal(i), false);
	}
	path.closePath();
}

/**
 * Distance from the point `(px, py)` to the segment from `(ax, ay)` to
 * `(bx, by)`; for a segment of no length, to that point. Also the basis of a
 * hover test on a polyline: the nearest of its segments.
 */
export function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
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
	// A polygon of no size (`r` of 0) is a point: no side tells an inside.
	return inside && side !== 0 ? 0 : nearest;
}

/**
 * Distance from an offset `(dx, dy)` relative to the centre of a marker to
 * the outer edge of the marker as drawn, `0` inside it: for hit testing a
 * marker of outer radius `radius` with a stroke `strokeWidth` wide, traced
 * by {@link traceMarker} at `radius − strokeWidth / 2` and stroked with round
 * joins, so its corners are rounded by half the stroke.
 *
 * @param shape - the marker shape.
 * @param dx - horizontal offset from the centre, in the units of `radius`.
 * @param dy - vertical offset from the centre, down positive.
 * @param radius - half the drawn size, stroke included.
 * @param strokeWidth - width of the stroke around the marker; `0` for none.
 */
export function markerDistance(shape: MarkerShape, dx: number, dy: number, radius: number, strokeWidth: number = 0): number {
	const halfStroke = Math.max(0, Math.min(strokeWidth / 2, radius));
	const outline = radius - halfStroke;
	let distance: number;
	if (shape === 'square') {
		// The polygon distance, without walking the sides.
		distance = Math.hypot(Math.max(0, Math.abs(dx) - outline), Math.max(0, Math.abs(dy) - outline));
	} else {
		const vertices = markerVertices(shape);
		distance = vertices === null
			? Math.max(0, Math.hypot(dx, dy) - outline)
			: polygonDistance(vertices, dx, dy, outline);
	}
	return Math.max(0, distance - halfStroke);
}
