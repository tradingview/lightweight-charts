/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { Coordinate } from '../../src/model/coordinate';
import { LinePoint } from '../../src/renderers/draw-line';
import { getControlPoints } from '../../src/renderers/walk-line';

function point(x: number, y: number): LinePoint {
	return { x: x as Coordinate, y: y as Coordinate };
}

function expectControlPointsWithinYRange(
	points: readonly LinePoint[],
	endPointIndex: number
): void {
	const [cp1, cp2] = getControlPoints(points, endPointIndex);
	const minY = Math.min(points[endPointIndex - 1].y, points[endPointIndex].y);
	const maxY = Math.max(points[endPointIndex - 1].y, points[endPointIndex].y);

	expect(cp1.y).to.be.within(
		minY,
		maxY,
		`segment ${endPointIndex - 1} -> ${endPointIndex}`
	);
	expect(cp2.y).to.be.within(
		minY,
		maxY,
		`segment ${endPointIndex - 1} -> ${endPointIndex}`
	);
}

describe('getControlPoints', () => {
	it('should keep a flat segment flat when the next segment drops sharply', () => {
		// Data from https://github.com/tradingview/lightweight-charts/issues/1680
		const points = [point(0, 100), point(10, 100), point(20, 20)];

		const [cp1, cp2] = getControlPoints(points, 1);
		expect(cp1.y).to.equal(100);
		expect(cp2.y).to.equal(100);
	});

	it('should not overshoot the y-range of segment end points - plateau with drop', () => {
		const points = [point(0, 100), point(10, 100), point(20, 20)];

		for (let i = 1; i < points.length; i++) {
			expectControlPointsWithinYRange(points, i);
		}
	});

	it('should not overshoot the y-range of segment end points - spikes', () => {
		const points = [
			point(0, 3),
			point(10, 3),
			point(20, 1),
			point(30, 1),
			point(40, 3),
			point(50, 1),
		];

		for (let i = 1; i < points.length; i++) {
			expectControlPointsWithinYRange(points, i);
		}
	});

	it('should have a horizontal tangent at a local extreme', () => {
		const points = [point(0, 0), point(10, 10), point(20, 0)];

		const [, cp2First] = getControlPoints(points, 1);
		const [cp1Second] = getControlPoints(points, 2);

		expect(cp2First.y).to.equal(10);
		expect(cp1Second.y).to.equal(10);
	});

	it('should produce a straight line for a two point series', () => {
		const points = [point(0, 0), point(30, 15)];

		const [cp1, cp2] = getControlPoints(points, 1);

		expect(cp1.y).to.be.closeTo(cp1.x / 2, 1e-9);
		expect(cp2.y).to.be.closeTo(cp2.x / 2, 1e-9);
	});

	it('should not produce NaN when neighbouring points share an x coordinate', () => {
		const points = [point(0, 0), point(0, 10), point(10, 5), point(10, 20)];

		for (let i = 1; i < points.length; i++) {
			const [cp1, cp2] = getControlPoints(points, i);

			expect(Number.isFinite(cp1.x), `cp1.x of segment ending at ${i}`).to.equal(true);
			expect(Number.isFinite(cp1.y), `cp1.y of segment ending at ${i}`).to.equal(true);
			expect(Number.isFinite(cp2.x), `cp2.x of segment ending at ${i}`).to.equal(true);
			expect(Number.isFinite(cp2.y), `cp2.y of segment ending at ${i}`).to.equal(true);
		}
	});

	it('should keep control point x coordinates within the segment', () => {
		const points = [
			point(0, 5),
			point(10, 15),
			point(20, 7.5),
			point(30, 30),
		];

		for (let i = 1; i < points.length; i++) {
			const [cp1, cp2] = getControlPoints(points, i);

			expect(cp1.x).to.be.greaterThan(points[i - 1].x);
			expect(cp1.x).to.be.lessThan(points[i].x);
			expect(cp2.x).to.be.greaterThan(points[i - 1].x);
			expect(cp2.x).to.be.lessThan(points[i].x);
		}
	});
});
