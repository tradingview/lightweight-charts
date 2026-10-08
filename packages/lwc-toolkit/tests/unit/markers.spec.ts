import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	MarkerPath,
	MarkerShape,
	markerDistance,
	markerVertices,
	segmentDistance,
	traceMarker,
	traceMarkerOffset,
} from '../../src/canvas/markers.js';

const SHAPES: MarkerShape[] = ['circle', 'square', 'diamond', 'triangleUp', 'triangleDown'];
const POLYGONS: MarkerShape[] = ['square', 'diamond', 'triangleUp', 'triangleDown'];

interface Arc {
	x: number;
	y: number;
	radius: number;
	start: number;
	end: number;
}

/** A path which records what is traced on it. */
function recordingPath(): MarkerPath & { ops: string[]; points: number[][]; arcs: Arc[] } {
	const ops: string[] = [];
	const points: number[][] = [];
	const arcs: Arc[] = [];
	return {
		ops,
		points,
		arcs,
		moveTo: (x: number, y: number): void => {
			ops.push('moveTo');
			points.push([x, y]);
		},
		lineTo: (x: number, y: number): void => {
			ops.push('lineTo');
			points.push([x, y]);
		},
		arc: (x: number, y: number, radius: number, start: number, end: number): void => {
			ops.push('arc');
			arcs.push({ x, y, radius, start, end });
		},
		closePath: (): void => {
			ops.push('closePath');
		},
	};
}

/** Twice the signed area of a polygon, positive when it is clockwise on screen (y down). */
function signedArea(vertices: readonly number[]): number {
	let area = 0;
	const count = vertices.length / 2;
	for (let i = 0; i < count; i++) {
		const j = (i + 1) % count;
		area += vertices[2 * i] * vertices[2 * j + 1] - vertices[2 * j] * vertices[2 * i + 1];
	}
	return area;
}

void describe('markerVertices', () => {
	void it('gives every polygon clockwise on screen, within the square of side 2 around the centre', () => {
		for (const shape of POLYGONS) {
			const vertices = markerVertices(shape) as readonly number[];
			expect(vertices, shape).to.not.equal(null);
			expect(signedArea(vertices), shape).to.be.greaterThan(0);
			for (const value of vertices) {
				expect(Math.abs(value), shape).to.be.at.most(1);
			}
		}
		expect(markerVertices('circle')).to.equal(null);
	});

	void it('points the triangles the way they are named', () => {
		const up = markerVertices('triangleUp') as readonly number[];
		const down = markerVertices('triangleDown') as readonly number[];
		expect([up[0], up[1]]).to.deep.equal([0, -1]);
		expect([down[0], down[1]]).to.deep.equal([0, 1]);
	});
});

void describe('traceMarker', () => {
	void it('traces a circle as one arc of the radius, begun where the arc starts', () => {
		const path = recordingPath();
		traceMarker(path, 'circle', 10, 20, 5);
		expect(path.ops).to.deep.equal(['moveTo', 'arc']);
		expect(path.points).to.deep.equal([[15, 20]]);
		expect(path.arcs).to.deep.equal([{ x: 10, y: 20, radius: 5, start: 0, end: 2 * Math.PI }]);
	});

	void it('traces a circle with the arc alone on an empty path, and polygons as ever', () => {
		const path = recordingPath();
		traceMarker(path, 'circle', 10, 20, 5, true);
		expect(path.ops).to.deep.equal(['arc']);
		for (const shape of POLYGONS) {
			const batched = recordingPath();
			const alone = recordingPath();
			traceMarker(batched, shape, 10, 20, 5);
			traceMarker(alone, shape, 10, 20, 5, true);
			expect(alone.ops, shape).to.deep.equal(batched.ops);
			expect(alone.points, shape).to.deep.equal(batched.points);
		}
	});

	void it('traces each polygon through the vertices the hit test and the offset outline use, in their order', () => {
		for (const shape of POLYGONS) {
			const path = recordingPath();
			traceMarker(path, shape, 10, 20, 4);
			const vertices = markerVertices(shape) as readonly number[];
			const expected: number[][] = [];
			for (let i = 0; i < vertices.length; i += 2) {
				expected.push([10 + vertices[i] * 4, 20 + vertices[i + 1] * 4]);
			}
			expect(path.points, shape).to.deep.equal(expected);
			expect(path.ops, shape).to.deep.equal(['moveTo', ...expected.slice(1).map(() => 'lineTo'), 'closePath']);
		}
	});

	void it('traces triangleDown with its tip at the bottom, clockwise on screen', () => {
		const path = recordingPath();
		traceMarker(path, 'triangleDown', 0, 0, 1);
		expect(path.points).to.deep.equal([[0, 1], [-1, -1], [1, -1]]);
	});
});

void describe('traceMarkerOffset', () => {
	void it('traces a circle the offset larger', () => {
		const path = recordingPath();
		traceMarkerOffset(path, 'circle', 10, 20, 5, 3);
		expect(path.ops).to.deep.equal(['moveTo', 'arc']);
		expect(path.points).to.deep.equal([[18, 20]]);
		expect(path.arcs).to.deep.equal([{ x: 10, y: 20, radius: 8, start: 0, end: 2 * Math.PI }]);
		const alone = recordingPath();
		traceMarkerOffset(alone, 'circle', 10, 20, 5, 3, true);
		expect(alone.ops).to.deep.equal(['arc']);
	});

	void it('rounds every corner of a polygon with the offset, outside it, and closes the outline', () => {
		for (const shape of POLYGONS) {
			const path = recordingPath();
			const radius = 10;
			const offset = 3;
			traceMarkerOffset(path, shape, 50, 60, radius, offset);
			const vertices = markerVertices(shape) as readonly number[];
			expect(path.arcs.length, shape).to.equal(vertices.length / 2);
			expect(path.ops[path.ops.length - 1], shape).to.equal('closePath');
			path.arcs.forEach((arc: Arc, i: number) => {
				expect([arc.x, arc.y], shape).to.deep.equal([50 + vertices[2 * i] * radius, 60 + vertices[2 * i + 1] * radius]);
				expect(arc.radius, shape).to.equal(offset);
				// Both ends of every arc lie `offset` outside the marker: on the
				// sides moved outwards, not inside the polygon.
				// The arc runs clockwise on screen, with growing angles, from start to end.
				const sweep = (((arc.end - arc.start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
				expect(sweep, shape).to.be.greaterThan(0).and.lessThan(Math.PI);
				for (const angle of [arc.start, arc.end, arc.start + sweep / 2]) {
					const px = arc.x + offset * Math.cos(angle) - 50;
					const py = arc.y + offset * Math.sin(angle) - 60;
					expect(markerDistance(shape, px, py, radius), `${shape} at ${angle}`).to.be.closeTo(offset, 1e-9);
				}
			});
		}
	});
});

/**
 * A path following the canvas rules for where lines go: `arc` draws a line
 * from the current point to its start, `closePath` returns to the start of
 * the subpath. Records every straight line drawn, with the marker it was
 * traced for.
 */
function linePath(): MarkerPath & { marker: number; lines: { marker: number; from: number[]; to: number[] }[] } {
	let current: number[] | null = null;
	let subpathStart: number[] | null = null;
	const result = {
		marker: -1,
		lines: [] as { marker: number; from: number[]; to: number[] }[],
		moveTo: (x: number, y: number): void => {
			current = [x, y];
			subpathStart = [x, y];
		},
		lineTo: (x: number, y: number): void => {
			if (current !== null) {
				result.lines.push({ marker: result.marker, from: current, to: [x, y] });
			}
			current = [x, y];
			subpathStart ??= [x, y];
		},
		arc: (x: number, y: number, radius: number, start: number, end: number): void => {
			const from = [x + radius * Math.cos(start), y + radius * Math.sin(start)];
			if (current !== null && Math.hypot(from[0] - current[0], from[1] - current[1]) > 1e-9) {
				result.lines.push({ marker: result.marker, from: current, to: from });
			}
			subpathStart ??= from;
			current = [x + radius * Math.cos(end), y + radius * Math.sin(end)];
		},
		closePath: (): void => {
			current = subpathStart;
		},
	};
	return result;
}

void describe('several markers in one path', () => {
	void it('are never joined by a line: each one is a subpath of its own', () => {
		const path = linePath();
		const centres: number[][] = [];
		for (const trace of ['marker', 'offset'] as const) {
			for (const shape of SHAPES) {
				const centre = [20 + 40 * centres.length, 30 + 10 * (centres.length % 3)];
				path.marker = centres.length;
				centres.push(centre);
				if (trace === 'marker') {
					traceMarker(path, shape, centre[0], centre[1], 6);
				} else {
					traceMarkerOffset(path, shape, centre[0], centre[1], 6, 3);
				}
			}
		}
		// Every straight line, the sides of the polygons and of their offset
		// outlines included, stays within the marker it was traced for.
		const reach = (6 + 3) * Math.SQRT2 + 1e-9;
		for (const line of path.lines) {
			const [cx, cy] = centres[line.marker];
			for (const [x, y] of [line.from, line.to]) {
				expect(Math.max(Math.abs(x - cx), Math.abs(y - cy)), `line of marker ${line.marker}`).to.be.at.most(reach);
			}
		}
		expect(path.lines.length).to.be.greaterThan(0);
	});
});

void describe('segmentDistance', () => {
	void it('measures to the nearest point of the segment', () => {
		expect(segmentDistance(5, 3, 0, 0, 10, 0)).to.equal(3);
		expect(segmentDistance(-3, 4, 0, 0, 10, 0)).to.equal(5);
		expect(segmentDistance(13, -4, 0, 0, 10, 0)).to.equal(5);
		expect(segmentDistance(1, 1, 0, 0, 2, 2)).to.equal(0);
	});

	void it('measures to the point of a segment of no length', () => {
		expect(segmentDistance(3, 4, 0, 0, 0, 0)).to.equal(5);
	});
});

void describe('markerDistance', () => {
	void it('is zero inside and the gap to the outline outside', () => {
		expect(markerDistance('circle', 3, 4, 5)).to.equal(0);
		expect(markerDistance('circle', 6, 8, 5)).to.equal(5);
		expect(markerDistance('square', 7, 0, 5)).to.equal(2);
		expect(markerDistance('diamond', 3, 2, 5)).to.equal(0);
	});

	void it('measures to the corner of a square, not to its sides', () => {
		expect(markerDistance('square', 5, 5, 5)).to.equal(0);
		expect(markerDistance('square', 8, 9, 5)).to.equal(5);
	});

	void it('measures to the vertex of a diamond beyond its tip', () => {
		expect(markerDistance('diamond', 0, 8, 5)).to.be.closeTo(3, 1e-9);
		expect(markerDistance('diamond', 3, 3, 5)).to.be.closeTo(1 / Math.SQRT2, 1e-9);
	});

	void it('follows the triangles as drawn: corners at the full radius, a tip at the top or the bottom', () => {
		// Triangle up: tip (0, −r), base corners (±r, r).
		expect(markerDistance('triangleUp', 9.5, 9.5, 10)).to.equal(0);
		expect(markerDistance('triangleUp', 0, -9.5, 10)).to.equal(0);
		expect(markerDistance('triangleUp', 0, 11, 10)).to.be.closeTo(1, 1e-9);
		// Beside the tip, outside the triangle although inside its circle.
		expect(markerDistance('triangleUp', 7, -7, 10)).to.be.greaterThan(4);
		// Beyond a base corner: the distance to the corner, which the circle of radius r missed.
		expect(markerDistance('triangleUp', 13, 14, 10)).to.be.closeTo(5, 1e-9);
		// Triangle down mirrors it.
		expect(markerDistance('triangleDown', 9.5, -9.5, 10)).to.equal(0);
		expect(markerDistance('triangleDown', 0, 9.5, 10)).to.equal(0);
		expect(markerDistance('triangleDown', 7, 7, 10)).to.be.greaterThan(4);
	});

	void it('reaches half the stroke beyond the traced outline', () => {
		// A 20 px circle with a 2 px stroke is traced at radius 9 and stroked to 10.
		expect(markerDistance('circle', 10, 0, 10, 2)).to.equal(0);
		expect(markerDistance('circle', 12, 0, 10, 2)).to.be.closeTo(2, 1e-9);
		// The corner of a stroked triangle is rounded: just beyond it, outside.
		expect(markerDistance('triangleUp', 9.9, 9.9, 10, 2)).to.be.greaterThan(0);
		expect(markerDistance('triangleUp', 9, 9, 10, 2)).to.equal(0);
	});

	void it('measures to the point a marker of no size is, for every shape', () => {
		for (const shape of SHAPES) {
			expect(markerDistance(shape, 3, 4, 0), shape).to.equal(5);
			expect(markerDistance(shape, 0, 0, 0), shape).to.equal(0);
			// A stroke as wide as the marker leaves an outline of no size, stroked to the radius.
			expect(markerDistance(shape, 3, 4, 2, 4), shape).to.be.closeTo(3, 1e-9);
			expect(markerDistance(shape, 1, 1, 2, 4), shape).to.equal(0);
		}
	});

	void it('is zero on the traced outline of every shape, and grows outside it', () => {
		for (const shape of SHAPES) {
			const path = recordingPath();
			traceMarker(path, shape, 0, 0, 8);
			const outline = shape === 'circle' ? [[8, 0], [0, -8], [-8, 0], [0, 8]] : path.points;
			for (const [x, y] of outline) {
				expect(markerDistance(shape, x, y, 8), `${shape} at ${x},${y}`).to.equal(0);
				expect(markerDistance(shape, x * 1.5, y * 1.5, 8), `${shape} beyond ${x},${y}`).to.be.greaterThan(0);
			}
		}
	});
});
