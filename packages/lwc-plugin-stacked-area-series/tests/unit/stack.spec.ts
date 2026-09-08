import { expect } from 'chai';
import { describe, it } from 'node:test';

import { paddedValues, percentValues, styleRuns, sumValues } from '../../src/stack.js';

void describe('paddedValues', () => {
	void it('pads a short point with zeroes', () => {
		expect(paddedValues([1, 2], 4)).to.deep.equal([1, 2, 0, 0]);
	});

	void it('truncates to the requested length', () => {
		expect(paddedValues([1, 2, 3], 2)).to.deep.equal([1, 2]);
	});

	void it('replaces a value which cannot be drawn, keeping the band positions', () => {
		expect(paddedValues([1, NaN, 3], 3)).to.deep.equal([1, 0, 3]);
	});
});

void describe('percentValues', () => {
	void it('scales to a total of 100', () => {
		expect(percentValues([1, 3])).to.deep.equal([25, 75]);
	});

	void it('scales by the absolute total so a mixed point stays symmetrical', () => {
		expect(percentValues([3, -1])).to.deep.equal([75, -25]);
	});

	void it('leaves a point which totals zero at zero', () => {
		expect(percentValues([0, 0])).to.deep.equal([0, 0]);
	});
});

void describe('sumValues', () => {
	void it('adds band by band and keeps the longer point', () => {
		expect(sumValues([1], [10, 20])).to.deep.equal([11, 20]);
	});
});

void describe('styleRuns', () => {
	const constant = (): string => 'a';

	void it('returns one run when the style never changes', () => {
		expect(styleRuns(0, 5, constant)).to.deep.equal([{ from: 0, to: 5 }]);
	});

	void it('returns nothing for an empty range', () => {
		expect(styleRuns(3, 3, constant)).to.deep.equal([]);
	});

	void it('returns a single-bar range, which draws nothing', () => {
		expect(styleRuns(3, 4, constant)).to.deep.equal([{ from: 3, to: 4 }]);
	});

	void it('overlaps the runs by one bar so the pieces meet', () => {
		// bars 0..4; the piece starting at bar 2 is styled differently
		const key = (index: number): string => (index >= 2 ? 'b' : 'a');
		expect(styleRuns(0, 5, key)).to.deep.equal([
			{ from: 0, to: 3 },
			{ from: 2, to: 5 },
		]);
	});

	void it('ignores a change on the last bar, which styles no piece', () => {
		const key = (index: number): string => (index >= 4 ? 'b' : 'a');
		expect(styleRuns(0, 5, key)).to.deep.equal([{ from: 0, to: 5 }]);
	});
});
