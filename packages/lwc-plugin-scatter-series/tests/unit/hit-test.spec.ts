import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ScatterGeometryCache, XMapping, YToCoordinate } from '../../src/geometry.js';
import { ScatterHit, ScatterHitGeometry, hitTestScatter as hitTestWith } from '../../src/hit-test.js';
import { ScatterModel, buildScatterModel } from '../../src/model.js';
import { ScatterShape, defaultOptions } from '../../src/options.js';

/** {@link hitTestWith} with the series' default tolerance and no hover growth unless given. */
function hitTestScatter(
	points: ScatterHitGeometry,
	x: number,
	y: number,
	hoveredIndex: number | null,
	tolerance: number = defaultOptions.hitTestTolerance,
	hoveredSizeIncrease: number = 0
): ScatterHit | null {
	return hitTestWith(points, x, y, hoveredIndex, tolerance, hoveredSizeIncrease);
}

/** The geometry of every visible point of `model`, as drawn. */
function computeGeometry(model: ScatterModel, mapping: XMapping, yToCoordinate: YToCoordinate): ScatterHitGeometry {
	return new ScatterGeometryCache().geometry(model, mapping, yToCoordinate);
}

interface TestPoint {
	x: number;
	y: number;
	r: number;
	shape?: ScatterShape;
	stroke?: number;
}

/** The geometry of `points`, drawn in `order`: a point not drawn has no coordinates (`NaN`). */
function geometry(points: TestPoint[], order: number[] = points.map((_: TestPoint, index: number) => index)): ScatterHitGeometry {
	const drawn = (index: number, value: number): number => (order.includes(index) ? value : Number.NaN);
	return {
		xs: points.map((point: TestPoint, index: number) => drawn(index, point.x)),
		ys: points.map((point: TestPoint, index: number) => drawn(index, point.y)),
		radii: points.map((point: TestPoint) => point.r),
		shapes: points.map((point: TestPoint) => point.shape ?? 'circle'),
		strokeWidths: points.map((point: TestPoint) => point.stroke ?? 0),
		order,
	};
}

void describe('hitTestScatter', () => {
	void it('finds the topmost of overlapping points: the last one drawn', () => {
		const points = [{ x: 50, y: 50, r: 10 }, { x: 55, y: 50, r: 10 }, { x: 200, y: 50, r: 10 }];
		expect(hitTestScatter(geometry(points), 52, 50, null)).to.deep.equal({ index: 1, distance: 0 });
		expect(hitTestScatter(geometry(points, [1, 0, 2]), 52, 50, null)).to.deep.equal({ index: 0, distance: 0 });
	});

	void it('prefers the hovered point, which is drawn on top of all others', () => {
		const points = [{ x: 50, y: 50, r: 10 }, { x: 55, y: 50, r: 10 }];
		expect(hitTestScatter(geometry(points), 52, 50, 0)).to.deep.equal({ index: 0, distance: 0 });
	});

	void it('does not prefer a hovered point which is not drawn', () => {
		const points = [{ x: 50, y: 50, r: 10 }, { x: 55, y: 50, r: 10 }];
		expect(hitTestScatter(geometry(points, [1]), 52, 50, 0)).to.deep.equal({ index: 1, distance: 0 });
	});

	void it('hits a tiny dot within the tolerance', () => {
		const points = [{ x: 50, y: 50, r: 2.5 }];
		expect(hitTestScatter(geometry(points), 54.5, 50, null, 3)).to.deep.equal({ index: 0, distance: 2 });
		expect(hitTestScatter(geometry(points), 56, 50, null, 3)).to.equal(null);
		expect(hitTestScatter(geometry(points), 54.5, 50, null, 0)).to.equal(null);
	});

	void it('takes the nearest point within the tolerance, the upper one on a tie', () => {
		const points = [{ x: 40, y: 50, r: 2.5 }, { x: 50, y: 50, r: 2.5 }, { x: 60, y: 50, r: 2.5 }];
		expect(hitTestScatter(geometry(points), 46, 50, null, 3)?.index).to.equal(1);
		expect(hitTestScatter(geometry(points), 45, 50, null, 3)?.index).to.equal(1);
	});

	void it('prefers a point containing the cursor over a nearer edge', () => {
		const points = [{ x: 50, y: 50, r: 20 }, { x: 72, y: 50, r: 2.5 }];
		expect(hitTestScatter(geometry(points, [1, 0]), 68, 50, null, 3)?.index).to.equal(0);
	});

	void it('skips points without coordinates', () => {
		const points = [{ x: Number.NaN, y: 50, r: 10 }, { x: 50, y: Number.NaN, r: 10 }];
		expect(hitTestScatter(geometry(points), 50, 50, null)).to.equal(null);
	});

	void it('finds nothing in an empty plot', () => {
		expect(hitTestScatter(geometry([]), 50, 50, null)).to.equal(null);
	});

	void it('grows the hovered point by hoveredSizeIncrease, and no other', () => {
		const points = [{ x: 50, y: 50, r: 5 }, { x: 80, y: 50, r: 5 }];
		// 7 px from the centre: outside a 10 px point, inside one 6 px larger.
		expect(hitTestScatter(geometry(points), 57, 50, 0, 0, 6)).to.deep.equal({ index: 0, distance: 0 });
		expect(hitTestScatter(geometry(points), 57, 50, null, 0, 6)).to.equal(null);
		expect(hitTestScatter(geometry(points), 57, 50, 0, 0, 0)).to.equal(null);
		expect(hitTestScatter(geometry(points), 87, 50, 0, 0, 6)).to.equal(null);
	});

	void it('tests each point with its own shape and stroke', () => {
		const points = [
			{ x: 50, y: 50, r: 10, shape: 'square' as const, stroke: 4 },
			{ x: 100, y: 50, r: 10, shape: 'square' as const, stroke: 0 },
		];
		// The corner of a square stroked with round joins is cut; of an unstroked one it is not.
		expect(hitTestScatter(geometry(points), 59.6, 59.6, null, 0)).to.equal(null);
		expect(hitTestScatter(geometry(points), 109.6, 59.6, null, 0)?.index).to.equal(1);
	});

	void it('caps the stroke to a quarter of the size, as drawn', () => {
		// A 4 px square with a 3 px stroke is stroked 1 px wide, traced at 1.5 px:
		// its corner reaches 1.5 + 0.5 / √2 along each axis, not 0.5 + 1.5 / √2.
		const square = [{ x: 50, y: 50, r: 2, shape: 'square' as const, stroke: 3 }];
		expect(hitTestScatter(geometry(square), 51.8, 51.8, null, 0)?.index).to.equal(0);
	});

	void it('follows the marker shape', () => {
		const square = [{ x: 50, y: 50, r: 10, shape: 'square' as const }];
		const diamond = [{ x: 50, y: 50, r: 10, shape: 'diamond' as const }];
		expect(hitTestScatter(geometry(square), 59, 59, null, 0)?.index).to.equal(0);
		expect(hitTestScatter(geometry(diamond), 59, 59, null, 0)).to.equal(null);
		expect(hitTestScatter(geometry(diamond), 50, 59, null, 0)?.index).to.equal(0);
	});
});

void describe('hitTestScatter on shapes', () => {
	void it('hits the corners of a triangle and misses beside its tip', () => {
		const triangle = [{ x: 50, y: 50, r: 10, shape: 'triangleUp' as const }];
		expect(hitTestScatter(geometry(triangle), 59, 59, null, 0)?.index).to.equal(0);
		expect(hitTestScatter(geometry(triangle), 41, 59, null, 0)?.index).to.equal(0);
		expect(hitTestScatter(geometry(triangle), 57, 43, null, 0)).to.equal(null);
	});
});

void describe('computeGeometry', () => {
	const model = buildScatterModel([
		{ x: 10, y: 10, group: 'shown' },
		{ x: 20, y: 20, group: 'hidden' },
		{ x: 30, y: 30 },
	], { ...defaultOptions, groups: [{ id: 'shown' }, { id: 'hidden', visible: false }], xRange: { min: 0, max: 100 } });
	// One pixel per X unit, Y as is; the price 30 has no coordinate.
	const geometry = computeGeometry(
		model,
		{ start: 0, origin: 0, pxPerUnit: 1 },
		(y: number) => (y === 30 ? null : y)
	);

	void it('places the visible points and leaves the others out', () => {
		expect([geometry.xs[0], geometry.ys[0]]).to.deep.equal([10, 10]);
		expect(Number.isNaN(geometry.xs[1])).to.equal(true);
		expect(Number.isNaN(geometry.ys[2])).to.equal(true);
		expect(geometry.radii[0]).to.equal(4.5);
		expect(Array.from(geometry.strokeWidths)).to.deep.equal([1, 1, 1]);
	});

	void it('takes the shape, size and stroke of every point as resolved', () => {
		const styled = buildScatterModel([
			{ x: 10, y: 10, shape: 'diamond', size: 20, strokeWidth: 3 },
			{ x: 20, y: 20, group: 'g' },
			{ x: 30, y: 10, group: 'g', hollow: false, strokeWidth: 0 },
		], { ...defaultOptions, groups: [{ id: 'g', shape: 'triangleDown', hollow: true, strokeWidth: 0 }], xRange: { min: 0, max: 100 } });
		const shaped = computeGeometry(styled, { start: 0, origin: 0, pxPerUnit: 1 }, (y: number) => y);
		expect(shaped.shapes).to.deep.equal(['diamond', 'triangleDown', 'triangleDown']);
		expect(Array.from(shaped.radii)).to.deep.equal([10, 4.5, 4.5]);
		// A hollow point's outline is at least 1 px.
		expect(Array.from(shaped.strokeWidths)).to.deep.equal([3, 1, 0]);
		// Just above the diamond's right corner: inside its circle, outside the diamond.
		expect(hitTestScatter(shaped, 17, 3, null, 0)).to.equal(null);
		expect(hitTestScatter(shaped, 18, 10, null, 0)?.index).to.equal(0);
	});

	void it('never hits a point of a hidden group', () => {
		expect(hitTestScatter(geometry, 10, 10, null)?.index).to.equal(0);
		expect(hitTestScatter(geometry, 20, 20, null)).to.equal(null);
		expect(hitTestScatter(geometry, 20, 20, 1)).to.equal(null);
	});
});

void describe('ScatterGeometryCache', () => {
	const model = buildScatterModel([{ x: 10, y: 10 }, { x: 30, y: 20 }], { ...defaultOptions, xRange: { min: 0, max: 100 } });
	const mapping = { start: 0, origin: 0, pxPerUnit: 1 };

	void it('reuses the geometry while the scales stay, and fills it again when they move', () => {
		const cache = new ScatterGeometryCache();
		let calls = 0;
		const y = (scale: number) => (price: number): number => {
			calls++;
			return price * scale;
		};
		const first = cache.geometry(model, mapping, y(1));
		const callsAfterFirst = calls;
		const again = cache.geometry(model, mapping, y(1));
		expect(again).to.equal(first);
		// Three probes per call, no point converted again.
		expect(calls - callsAfterFirst).to.equal(3);
		expect(Array.from(first.ys)).to.deep.equal([10, 20]);
		const rescaled = cache.geometry(model, mapping, y(2));
		expect(Array.from(rescaled.ys)).to.deep.equal([20, 40]);
		const moved = cache.geometry(model, { ...mapping, origin: 5 }, y(2));
		expect(Array.from(moved.xs)).to.deep.equal([15, 35]);
		// The arrays are reused, not allocated again.
		expect(moved.xs).to.equal(first.xs);
	});

	void it('notices a logarithmic scale whose offset changed, though 1 and 2 stay where they were', () => {
		const cache = new ScatterGeometryCache();
		// a·log10(p + c) + b through the same coordinates at 1 and 2, with another offset c.
		const log = (c: number) => (price: number): number => {
			const a = 100 / (Math.log10(2 + c) - Math.log10(1 + c));
			return 300 - (a * (Math.log10(price + c) - Math.log10(1 + c)));
		};
		const before = log(0);
		const after = (price: number): number => (price === 1 || price === 2 ? before(price) : log(0.01)(price));
		const first = Array.from(cache.geometry(model, mapping, before).ys);
		const second = Array.from(cache.geometry(model, mapping, after).ys);
		expect(second).to.not.deep.equal(first);
		expect(second).to.deep.equal([after(10), after(20)]);
	});

	void it('starts over for a new model', () => {
		const cache = new ScatterGeometryCache();
		const first = cache.geometry(model, mapping, (price: number) => price);
		const other = buildScatterModel([{ x: 50, y: 5 }], { ...defaultOptions, xRange: { min: 0, max: 100 } });
		const next = cache.geometry(other, mapping, (price: number) => price);
		expect(next.xs).to.not.equal(first.xs);
		expect(Array.from(next.xs)).to.deep.equal([50]);
	});
});
