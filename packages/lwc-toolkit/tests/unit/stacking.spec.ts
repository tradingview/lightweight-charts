import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	cumulativeSum,
	stackLevels,
	stackedPlotValues,
} from '../../src/custom-series/stacking.js';

void describe('cumulativeSum', () => {
	void it('returns the running totals', () => {
		expect(cumulativeSum([1, 2, 3])).to.deep.equal([1, 3, 6]);
	});

	void it('returns an empty array for no values', () => {
		expect(cumulativeSum([])).to.deep.equal([]);
	});

	void it('keeps the length of the input', () => {
		expect(cumulativeSum([5, 0, 0, 0])).to.deep.equal([5, 5, 5, 5]);
	});

	void it('lets negative values pull the running total back down', () => {
		expect(cumulativeSum([3, -2, 4])).to.deep.equal([3, 1, 5]);
	});

	void it('handles an all-negative stack', () => {
		expect(cumulativeSum([-1, -2, -3])).to.deep.equal([-1, -3, -6]);
	});

	void it('does not mutate the input', () => {
		const values = [1, 2, 3];
		cumulativeSum(values);
		expect(values).to.deep.equal([1, 2, 3]);
	});
});

void describe('stackedPlotValues', () => {
	void it('spans the baseline and the total for a positive stack', () => {
		expect(stackedPlotValues([1, 2, 3])).to.deep.equal([0, 6, 6]);
	});

	void it('spans the baseline and the total for a negative stack', () => {
		expect(stackedPlotValues([-1, -2, -3])).to.deep.equal([-6, 0, -6]);
	});

	void it('covers both ends of a mixed stack, not just the total', () => {
		// running totals: 3, 1, 5 -> the stack reaches 5 even though the
		// individual values never exceed 4
		expect(stackedPlotValues([3, -2, 4])).to.deep.equal([0, 5, 5]);
	});

	void it('keeps a mid-stack dip below the baseline in view', () => {
		// running totals: -4, 1 -> the stack goes down to -4 first
		expect(stackedPlotValues([-4, 5])).to.deep.equal([-4, 1, 1]);
	});

	void it('reports the total last, even when it is not an extreme', () => {
		// running totals: 10, 2
		expect(stackedPlotValues([10, -8])).to.deep.equal([0, 10, 2]);
	});

	void it('always includes the baseline in the range', () => {
		expect(stackedPlotValues([5, 1])).to.deep.equal([0, 6, 6]);
		expect(stackedPlotValues([-5, -1])).to.deep.equal([-6, 0, -6]);
	});

	void it('takes a non-zero baseline', () => {
		expect(stackedPlotValues([1, 2], 10)).to.deep.equal([1, 10, 3]);
		expect(stackedPlotValues([-1, -2], -10)).to.deep.equal([-10, -1, -3]);
	});

	void it('collapses to the baseline for an empty stack', () => {
		expect(stackedPlotValues([])).to.deep.equal([0, 0, 0]);
		expect(stackedPlotValues([], 4)).to.deep.equal([4, 4, 4]);
	});

	void it('returns three values, with the current value last', () => {
		const plotValues = stackedPlotValues([2, 2]);
		expect(plotValues).to.have.length(3);
		expect(plotValues[plotValues.length - 1]).to.equal(4);
	});
});

void describe('stackLevels', () => {
	void it('returns the band boundaries of a stack from zero', () => {
		expect(stackLevels([1, 2, 3])).to.deep.equal([1, 3, 6]);
	});

	void it('offsets every boundary by the base', () => {
		expect(stackLevels([1, 2, 3], 10)).to.deep.equal([11, 13, 16]);
	});

	void it('draws a negative band back down from the previous boundary', () => {
		expect(stackLevels([10, -4], 0)).to.deep.equal([10, 6]);
	});

	void it('returns an empty array for no values', () => {
		expect(stackLevels([], 5)).to.deep.equal([]);
	});
});
