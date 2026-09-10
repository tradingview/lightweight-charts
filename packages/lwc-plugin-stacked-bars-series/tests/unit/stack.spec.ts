import { expect } from 'chai';
import { describe, it } from 'node:test';

import { StackingOptions, bandValues, finiteValues, stackBands, sumValues } from '../../src/stack.js';

const normal: StackingOptions = { percent: false, stackOrder: 'normal' };

void describe('finiteValues', () => {
	void it('drops values which cannot be drawn', () => {
		expect(finiteValues([1, NaN, 2, Infinity, 3])).to.deep.equal([1, 2, 3]);
	});
});

void describe('stackBands', () => {
	void it('keeps the value order and remembers the colour index', () => {
		expect(stackBands([3, 1, 2], normal)).to.deep.equal([
			{ value: 3, index: 0 },
			{ value: 1, index: 1 },
			{ value: 2, index: 2 },
		]);
	});

	void it('drops a non-finite value without shifting the colours of the rest', () => {
		expect(stackBands([3, NaN, 2], normal)).to.deep.equal([
			{ value: 3, index: 0 },
			{ value: 2, index: 2 },
		]);
	});

	void it('reverses the stacking order but not the colours', () => {
		expect(stackBands([3, 1], { ...normal, stackOrder: 'reverse' })).to.deep.equal([
			{ value: 1, index: 1 },
			{ value: 3, index: 0 },
		]);
	});

	void it('scales to a total of 100 in percent mode', () => {
		expect(stackBands([1, 3], { ...normal, percent: true })).to.deep.equal([
			{ value: 25, index: 0 },
			{ value: 75, index: 1 },
		]);
	});

	void it('scales by the absolute total so a mixed stack stays symmetrical', () => {
		expect(stackBands([3, -1], { ...normal, percent: true })).to.deep.equal([
			{ value: 75, index: 0 },
			{ value: -25, index: 1 },
		]);
	});

	void it('collapses to zero rather than dividing by zero', () => {
		expect(stackBands([0, 0], { ...normal, percent: true })).to.deep.equal([
			{ value: 0, index: 0 },
			{ value: 0, index: 1 },
		]);
	});
});

void describe('bandValues', () => {
	void it('returns the values in stacking order', () => {
		expect(bandValues(stackBands([3, 1], normal))).to.deep.equal([3, 1]);
	});
});

void describe('sumValues', () => {
	void it('adds band by band', () => {
		expect(sumValues([1, 2], [10, 20])).to.deep.equal([11, 22]);
	});

	void it('keeps the bands only one of the points has', () => {
		expect(sumValues([1], [10, 20])).to.deep.equal([11, 20]);
	});
});
