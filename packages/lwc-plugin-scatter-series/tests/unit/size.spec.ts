import { expect } from 'chai';
import { describe, it } from 'node:test';

import { defaultOptions } from '../../src/options.js';
import {
	DEFAULT_POINT_SIZE_LIMITS,
	POINT_SIZE_LIMITS_CEILING,
	POINT_SIZE_LIMITS_FLOOR,
	SizeScaling,
	cappedStrokeWidth,
	clampPointSize,
	mapSizeValue,
	normalizeSizeLimits,
	normalizeSizeRange,
	resolveSizeDomain,
} from '../../src/size.js';

const linear = (min: number, max: number): SizeScaling => ({
	domain: { min: 0, max: 100 },
	range: { min, max },
	scale: 'linear',
});

void describe('clampPointSize', () => {
	void it('keeps sizes within 5–50 px', () => {
		expect(DEFAULT_POINT_SIZE_LIMITS).to.deep.equal({ min: 5, max: 50 });
		// One source of truth: the published default options carry the same limits.
		expect(defaultOptions.pointSizeLimits).to.deep.equal(DEFAULT_POINT_SIZE_LIMITS);
		expect(clampPointSize(1)).to.equal(5);
		expect(clampPointSize(9)).to.equal(9);
		expect(clampPointSize(80)).to.equal(50);
		expect(clampPointSize(Number.NaN)).to.equal(5);
	});
});

void describe('normalizeSizeRange', () => {
	void it('clamps both ends and puts them in order', () => {
		expect(normalizeSizeRange({ min: 3, max: 24 })).to.deep.equal({ min: 5, max: 24 });
		expect(normalizeSizeRange({ min: 60, max: 10 })).to.deep.equal({ min: 10, max: 50 });
	});

	void it('clamps to the size limits given', () => {
		expect(normalizeSizeRange({ min: 5, max: 25 }, { min: 2, max: 3 })).to.deep.equal({ min: 3, max: 3 });
		expect(normalizeSizeRange({ min: 1, max: 80 }, { min: 2, max: 100 })).to.deep.equal({ min: 2, max: 80 });
	});
});

void describe('normalizeSizeLimits', () => {
	void it('keeps limits within 1–500 px', () => {
		expect([POINT_SIZE_LIMITS_FLOOR, POINT_SIZE_LIMITS_CEILING]).to.deep.equal([1, 500]);
		expect(normalizeSizeLimits({ min: 5, max: 50 })).to.deep.equal({ min: 5, max: 50 });
		expect(normalizeSizeLimits({ min: 0, max: 900 })).to.deep.equal({ min: 1, max: 500 });
		expect(normalizeSizeLimits({ min: -3, max: 0.5 })).to.deep.equal({ min: 1, max: 1 });
		expect(normalizeSizeLimits({ min: 2.5, max: 3 })).to.deep.equal({ min: 2.5, max: 3 });
	});

	void it('takes the default for an end which is not a number, and swaps reversed ends', () => {
		expect(normalizeSizeLimits({ min: Number.NaN, max: Number.POSITIVE_INFINITY })).to.deep.equal({ min: 5, max: 50 });
		expect(normalizeSizeLimits({ min: 2 })).to.deep.equal({ min: 2, max: 50 });
		expect(normalizeSizeLimits(null)).to.deep.equal({ min: 5, max: 50 });
		expect(normalizeSizeLimits({ min: 60, max: 50 })).to.deep.equal({ min: 50, max: 60 });
	});

	void it('limits every clamped size', () => {
		const limits = normalizeSizeLimits({ min: 2, max: 3 });
		expect(clampPointSize(1, limits)).to.equal(2);
		expect(clampPointSize(2.5, limits)).to.equal(2.5);
		expect(clampPointSize(9, limits)).to.equal(3);
		expect(clampPointSize(Number.NaN, limits)).to.equal(2);
	});
});

void describe('cappedStrokeWidth', () => {
	void it('keeps the stroke of points four times its width or larger', () => {
		expect(cappedStrokeWidth(5, 1)).to.equal(1);
		expect(cappedStrokeWidth(4, 1)).to.equal(1);
		expect(cappedStrokeWidth(18, 3)).to.equal(3);
	});

	void it('narrows the stroke of smaller points to a quarter of their size', () => {
		expect(cappedStrokeWidth(3, 1)).to.equal(0.75);
		expect(cappedStrokeWidth(2, 1)).to.equal(0.5);
		expect(cappedStrokeWidth(1, 3)).to.equal(0.25);
		expect(cappedStrokeWidth(2, 0)).to.equal(0);
	});
});

void describe('resolveSizeDomain', () => {
	void it('takes open ends from the values', () => {
		expect(resolveSizeDomain([4, 1, 9, Number.NaN], { min: null, max: null })).to.deep.equal({ min: 1, max: 9 });
		expect(resolveSizeDomain([4, 1, 9], { min: 0, max: null })).to.deep.equal({ min: 0, max: 9 });
	});

	void it('needs no values when both ends are given', () => {
		expect(resolveSizeDomain([], { min: 0, max: 10 })).to.deep.equal({ min: 0, max: 10 });
	});

	void it('collapses an open end the values put past the given one, rather than reversing the domain', () => {
		// Every value below a given min: the domain is that min alone, the values below it.
		expect(resolveSizeDomain([1, 20, 50], { min: 100, max: null })).to.deep.equal({ min: 100, max: 100 });
		expect(resolveSizeDomain([1, 20, 50], { min: null, max: -5 })).to.deep.equal({ min: -5, max: -5 });
		// Values on both sides of the given end keep their own extreme.
		expect(resolveSizeDomain([1, 20, 150], { min: 100, max: null })).to.deep.equal({ min: 100, max: 150 });
		expect(resolveSizeDomain([-10, 20], { min: null, max: 0 })).to.deep.equal({ min: -10, max: 0 });
		// Two given ends in reverse order still reverse the mapping on purpose.
		expect(resolveSizeDomain([1, 2], { min: 10, max: 0 })).to.deep.equal({ min: 10, max: 0 });
	});

	void it('sizes every value below a one-sided min at the smallest size, above a one-sided max at the largest', () => {
		const range = { min: 5, max: 25 };
		const below = resolveSizeDomain([1, 20, 50], { min: 100, max: null });
		const above = resolveSizeDomain([1, 20, 50], { min: null, max: -5 });
		for (const value of [1, 20, 50]) {
			expect(mapSizeValue(value, { domain: below!, range, scale: 'linear' })).to.equal(5);
			expect(mapSizeValue(value, { domain: above!, range, scale: 'area' })).to.equal(25);
		}
	});

	void it('is null when an end is open and there is no value', () => {
		expect(resolveSizeDomain([], { min: null, max: 10 })).to.equal(null);
		expect(resolveSizeDomain([Number.NaN], { min: null, max: null })).to.equal(null);
	});
});

void describe('mapSizeValue', () => {
	void it('maps the domain linearly onto the range', () => {
		expect(mapSizeValue(0, linear(5, 25))).to.equal(5);
		expect(mapSizeValue(50, linear(5, 25))).to.equal(15);
		expect(mapSizeValue(100, linear(5, 25))).to.equal(25);
	});

	void it('clamps values outside the domain to its ends', () => {
		expect(mapSizeValue(-10, linear(10, 20))).to.equal(10);
		expect(mapSizeValue(500, linear(10, 20))).to.equal(20);
	});

	void it('interpolates the area for the area scale', () => {
		const area: SizeScaling = { ...linear(10, 30), scale: 'area' };
		expect(mapSizeValue(0, area)).to.equal(10);
		expect(mapSizeValue(100, area)).to.equal(30);
		expect(mapSizeValue(50, area)).to.be.closeTo(Math.sqrt((10 * 10 + 30 * 30) / 2), 1e-9);
		// The diameter grows slower than the value: a quarter of the value is
		// a quarter of the extra area.
		expect(mapSizeValue(25, area)).to.be.closeTo(Math.sqrt(100 + 0.25 * 800), 1e-9);
	});

	void it('draws the value of a single-value domain at the middle of the range, the others at its ends', () => {
		const flat: SizeScaling = { domain: { min: 7, max: 7 }, range: { min: 10, max: 20 }, scale: 'linear' };
		expect(mapSizeValue(7, flat)).to.equal(15);
		expect(mapSizeValue(100, flat)).to.equal(20);
		expect(mapSizeValue(-3, flat)).to.equal(10);
	});

	void it('maps domains of huge values without overflowing', () => {
		const huge: SizeScaling = { domain: { min: -1e308, max: 1e308 }, range: { min: 10, max: 20 }, scale: 'linear' };
		expect(mapSizeValue(0, huge)).to.equal(15);
		expect(mapSizeValue(1e308, huge)).to.equal(20);
	});

	void it('stays within the range, however the area is rounded', () => {
		const area: SizeScaling = { domain: { min: 0, max: 3 }, range: { min: 2.2, max: 3.1 }, scale: 'area' };
		for (let value = -1; value <= 4; value += 0.25) {
			const size = mapSizeValue(value, area);
			expect(size).to.be.within(2.2, 3.1);
		}
		expect(mapSizeValue(3, area)).to.equal(3.1);
	});

	void it('handles a reversed domain', () => {
		const reversed: SizeScaling = { domain: { min: 100, max: 0 }, range: { min: 5, max: 25 }, scale: 'linear' };
		expect(mapSizeValue(100, reversed)).to.equal(5);
		expect(mapSizeValue(0, reversed)).to.equal(25);
	});
});
