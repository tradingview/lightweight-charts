import { expect } from 'chai';
import { describe, it } from 'node:test';

import { columnCount, groupedBarsBase, isDrawnValue } from '../../src/values';

void describe('isDrawnValue', () => {
	void it('draws a finite value other than the base', () => {
		expect(isDrawnValue(12, 0)).to.equal(true);
		expect(isDrawnValue(-3, 0)).to.equal(true);
		expect(isDrawnValue(0, 10)).to.equal(true);
	});

	void it('skips a value equal to the base, which would draw a column of no height', () => {
		expect(isDrawnValue(0, 0)).to.equal(false);
		expect(isDrawnValue(10, 10)).to.equal(false);
	});

	void it('skips null and values which are not finite numbers', () => {
		expect(isDrawnValue(null, 0)).to.equal(false);
		expect(isDrawnValue(undefined, 0)).to.equal(false);
		expect(isDrawnValue(NaN, 0)).to.equal(false);
		expect(isDrawnValue(Infinity, 0)).to.equal(false);
	});
});

void describe('groupedBarsBase', () => {
	void it('falls back to 0 for a base which is not a finite number', () => {
		expect(groupedBarsBase({ base: 12 })).to.equal(12);
		expect(groupedBarsBase({ base: NaN })).to.equal(0);
	});
});

void describe('columnCount', () => {
	const valuesOf = (point: { values?: (number | null)[] }) => point.values;

	void it('is the most values any point has, null slots included', () => {
		expect(columnCount([{ values: [1, 2] }, { values: [1, null, 3, 4] }, { values: [5] }], 0, valuesOf)).to.equal(4);
	});

	void it('counts a point that draws no column for nothing, and is at least one', () => {
		expect(columnCount([{ values: [1, 2, 3] }, { values: [null, null, null, null] }], 0, valuesOf)).to.equal(3);
		expect(columnCount([{ values: [1, 2] }, { values: [5, 5, 5, 5] }], 5, valuesOf)).to.equal(2);
		expect(columnCount([{}, { values: [] }], 0, valuesOf)).to.equal(1);
		expect(columnCount([], 0, valuesOf)).to.equal(1);
	});
});
