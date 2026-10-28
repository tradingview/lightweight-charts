import { expect } from 'chai';
import { describe, it } from 'node:test';

import { clampOpacity, finiteOr, isFiniteNumber, nonNegativeOr } from '../../src/numbers.js';

const NOT_FINITE: unknown[] = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '1', null, undefined, {}];

void describe('isFiniteNumber', () => {
	void it('is true for finite numbers only, without coercion', () => {
		expect([0, -1.5, 1e300].map(isFiniteNumber)).to.deep.equal([true, true, true]);
		expect(NOT_FINITE.map(isFiniteNumber)).to.deep.equal(NOT_FINITE.map(() => false));
	});
});

void describe('finiteOr', () => {
	void it('keeps a finite number and falls back otherwise', () => {
		expect(finiteOr(-3, 7)).to.equal(-3);
		for (const value of NOT_FINITE) {
			expect(finiteOr(value, 7)).to.equal(7);
		}
	});
});

void describe('nonNegativeOr', () => {
	void it('raises a finite number to at least 0 and falls back, as given, otherwise', () => {
		expect(nonNegativeOr(2.5, 1)).to.equal(2.5);
		expect(nonNegativeOr(-2, 1)).to.equal(0);
		expect(nonNegativeOr(Number.NaN, 1)).to.equal(1);
		expect(nonNegativeOr(undefined, -1)).to.equal(-1);
	});
});

void describe('clampOpacity', () => {
	void it('clamps to 0–1', () => {
		expect(clampOpacity(0.4, 1)).to.equal(0.4);
		expect(clampOpacity(-1, 1)).to.equal(0);
		expect(clampOpacity(3, 0)).to.equal(1);
	});

	void it('falls back for a value which is not a finite number, and clamps the fallback too', () => {
		expect(clampOpacity(Number.NaN, 0.65)).to.equal(0.65);
		expect(clampOpacity(undefined, 0.65)).to.equal(0.65);
		expect(clampOpacity(null, 2)).to.equal(1);
	});
});
