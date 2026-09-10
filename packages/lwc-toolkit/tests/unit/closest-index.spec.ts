import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ClosestTimeIndexFinder } from '../../src/closest-index.js';

interface Point {
	time: number;
	label?: string;
}

function finder(): ClosestTimeIndexFinder<Point> {
	return new ClosestTimeIndexFinder<Point>([
		{ time: 0 },
		{ time: 10 },
		{ time: 20 },
		{ time: 30 },
	]);
}

void describe('ClosestTimeIndexFinder', () => {
	void it('returns the exact index for a value present in the array', () => {
		expect(finder().findClosestIndex(20, 'left')).to.equal(2);
		expect(finder().findClosestIndex(20, 'right')).to.equal(2);
	});

	void it('clamps to 0 at or below the first time', () => {
		expect(finder().findClosestIndex(0, 'left')).to.equal(0);
		expect(finder().findClosestIndex(-100, 'left')).to.equal(0);
		expect(finder().findClosestIndex(-100, 'right')).to.equal(0);
	});

	void it('clamps to the last index at or above the last time', () => {
		expect(finder().findClosestIndex(30, 'right')).to.equal(3);
		expect(finder().findClosestIndex(1000, 'left')).to.equal(3);
		expect(finder().findClosestIndex(1000, 'right')).to.equal(3);
	});

	void it("direction 'left' returns the index to the RIGHT of the target", () => {
		// Questionable naming, but current behaviour: for a target between two
		// entries, 'left' yields the following (greater) index.
		expect(finder().findClosestIndex(5, 'left')).to.equal(1);
		expect(finder().findClosestIndex(15, 'left')).to.equal(2);
		expect(finder().findClosestIndex(25, 'left')).to.equal(3);
	});

	void it("direction 'right' returns the index to the LEFT of the target", () => {
		expect(finder().findClosestIndex(5, 'right')).to.equal(0);
		expect(finder().findClosestIndex(15, 'right')).to.equal(1);
		expect(finder().findClosestIndex(25, 'right')).to.equal(2);
	});

	void it('does not pick the nearest neighbour by distance, only by side', () => {
		// 9 is much closer to index 1 (time 10) than to index 0 (time 0)
		expect(finder().findClosestIndex(9, 'right')).to.equal(0);
		// 1 is much closer to index 0 (time 0) than to index 1 (time 10)
		expect(finder().findClosestIndex(1, 'left')).to.equal(1);
	});

	void it('caches per target and direction, so later mutations of the array are ignored', () => {
		const points: Point[] = [{ time: 0 }, { time: 10 }, { time: 20 }];
		const instance = new ClosestTimeIndexFinder<Point>(points);
		expect(instance.findClosestIndex(15, 'right')).to.equal(1);
		points[1].time = 100;
		// the cached answer is returned even though the array no longer supports it
		expect(instance.findClosestIndex(15, 'right')).to.equal(1);
		// an uncached target does read the mutated array
		expect(instance.findClosestIndex(50, 'right')).to.equal(2);
	});

	void it('caches the two directions separately', () => {
		const instance = finder();
		expect(instance.findClosestIndex(15, 'left')).to.equal(2);
		expect(instance.findClosestIndex(15, 'right')).to.equal(1);
		expect(instance.findClosestIndex(15, 'left')).to.equal(2);
	});

	void it('always returns 0 for a single element array', () => {
		const instance = new ClosestTimeIndexFinder<Point>([{ time: 5 }]);
		expect(instance.findClosestIndex(-1, 'left')).to.equal(0);
		expect(instance.findClosestIndex(5, 'left')).to.equal(0);
		expect(instance.findClosestIndex(99, 'right')).to.equal(0);
	});
});
