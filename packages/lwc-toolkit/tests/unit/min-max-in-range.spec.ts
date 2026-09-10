import { expect } from 'chai';
import { describe, it } from 'node:test';

import { UpperLowerInRange } from '../../src/min-max-in-range.js';

interface Band {
	upper: number;
	lower: number;
}

function ramp(count: number): Band[] {
	return Array.from({ length: count }, (_: unknown, i: number) => ({
		upper: i,
		lower: -i,
	}));
}

void describe('UpperLowerInRange', () => {
	void it('returns the min lower and max upper for a range', () => {
		const instance = new UpperLowerInRange<Band>(ramp(10), 10);
		expect(instance.getMinMax(0, 9)).to.deep.equal({ lower: -9, upper: 9 });
	});

	void it('widens the requested range to whole chunks', () => {
		// Questionable, but current behaviour: with chunkSize 10, asking for
		// 0..2 scans the entire first chunk (indices 0..9).
		const instance = new UpperLowerInRange<Band>(ramp(25), 10);
		expect(instance.getMinMax(0, 2)).to.deep.equal({ lower: -9, upper: 9 });
	});

	void it('is exact when chunkSize is 1', () => {
		const instance = new UpperLowerInRange<Band>(ramp(25), 1);
		expect(instance.getMinMax(0, 2)).to.deep.equal({ lower: -2, upper: 2 });
		expect(instance.getMinMax(5, 7)).to.deep.equal({ lower: -7, upper: 7 });
	});

	void it('spans every chunk the range touches', () => {
		const instance = new UpperLowerInRange<Band>(ramp(25), 10);
		// 5..12 touches chunks 0 (0..9) and 1 (10..19)
		expect(instance.getMinMax(5, 12)).to.deep.equal({ lower: -19, upper: 19 });
	});

	void it('clamps the final chunk to the end of the array', () => {
		const instance = new UpperLowerInRange<Band>(ramp(25), 10);
		// chunk 2 is 20..29 but the array ends at 24
		expect(instance.getMinMax(20, 24)).to.deep.equal({
			lower: -24,
			upper: 24,
		});
	});

	void it('tolerates an endIndex beyond the array without throwing', () => {
		const instance = new UpperLowerInRange<Band>(ramp(25), 10);
		expect(instance.getMinMax(0, 40)).to.deep.equal({ lower: -24, upper: 24 });
	});

	void it('defaults to a chunk size of 10', () => {
		const instance = new UpperLowerInRange<Band>(ramp(25));
		expect(instance.getMinMax(0, 0)).to.deep.equal({ lower: -9, upper: 9 });
	});

	void it('re-reads the array on every call: the range cache never hits', () => {
		// Questionable: `getMinMax` looks up its cache with `cacheKey in this._cache`
		// on a Map, which is always false, so results are recomputed each time.
		const data = ramp(10);
		const instance = new UpperLowerInRange<Band>(data, 10);
		expect(instance.getMinMax(0, 9)).to.deep.equal({ lower: -9, upper: 9 });
		data[0].upper = 100;
		expect(instance.getMinMax(0, 9)).to.deep.equal({ lower: -9, upper: 100 });
	});

	void it('returns an infinite range for an empty array', () => {
		const instance = new UpperLowerInRange<Band>([], 10);
		expect(instance.getMinMax(0, 0)).to.deep.equal({
			lower: Infinity,
			upper: -Infinity,
		});
	});

	void it('does not require lower to be below upper', () => {
		const instance = new UpperLowerInRange<Band>(
			[{ upper: -5, lower: 5 }],
			1
		);
		expect(instance.getMinMax(0, 0)).to.deep.equal({ lower: 5, upper: -5 });
	});
});
