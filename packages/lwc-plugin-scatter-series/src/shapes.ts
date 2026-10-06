import type { ScatterShape } from './options';

/*
 Outlines of the polygonal markers, as the renderer traces them: vertices of a
 marker of radius 1 centred on the origin, y pointing down, every polygon in
 the same (clockwise on screen) order.
 */
const SQUARE: readonly number[] = [-1, -1, 1, -1, 1, 1, -1, 1];
const DIAMOND: readonly number[] = [0, -1, 1, 0, 0, 1, -1, 0];
const TRIANGLE_UP: readonly number[] = [0, -1, 1, 1, -1, 1];
const TRIANGLE_DOWN: readonly number[] = [0, 1, -1, -1, 1, -1];

/**
 * The vertices of a polygonal marker of radius 1, as `[x0, y0, x1, y1, …]`,
 * clockwise on screen; `null` for a circle.
 */
export function markerVertices(shape: ScatterShape): readonly number[] | null {
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

/** The part of a canvas path the marker outlines are traced with. */
export type MarkerPath = Pick<CanvasPath, 'arc' | 'closePath' | 'lineTo' | 'moveTo' | 'rect'>;

/**
 * Adds to the current path the outline at `offset` pixels outside a marker of
 * radius `radius` centred on `(x, y)`: a circle `offset` larger, or the
 * polygon with every side moved `offset` outwards and its corners rounded —
 * the outer edge of the polygon stroked `2 × offset` wide with round joins.
 * Stroked `w` wide, it gives a ring of even width `w` at an even distance
 * `offset − w / 2` from the marker on every side.
 */
export function traceMarkerOffset(path: MarkerPath, shape: ScatterShape, x: number, y: number, radius: number, offset: number): void {
	const vertices = markerVertices(shape);
	if (vertices === null) {
		path.arc(x, y, radius + offset, 0, 2 * Math.PI);
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
		// From the side arriving at the vertex to the side leaving it: the
		// straight line from the previous arc is the side moved outwards.
		path.arc(vx, vy, offset, normal((i + count - 1) % count), normal(i), false);
	}
	path.closePath();
}
