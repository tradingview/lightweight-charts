import { expect } from 'chai';
import { describe, it } from 'node:test';

import { fullBarWidth } from '../../src/dimensions/full-width.js';

void describe('fullBarWidth', () => {
	void it('spans the whole bar slot at DPR 1', () => {
		// unlike positionsBox, the length here is exclusive (right - left), which
		// is what lets neighbouring bars abut without overlapping
		expect(fullBarWidth(10, 3, 1)).to.deep.equal({ position: 7, length: 6 });
	});

	void it('scales position and length by the pixel ratio', () => {
		expect(fullBarWidth(10, 3, 2)).to.deep.equal({
			position: 14,
			length: 12,
		});
	});

	void it('rounds each edge independently, so a fractional centre only moves the position', () => {
		expect(fullBarWidth(10.5, 3, 1)).to.deep.equal({
			position: 8,
			length: 6,
		});
	});

	void it('can produce a length that is not 2 * halfBarSpacing * pixelRatio at DPR 1.25', () => {
		// left edge 7.5 * 1.25 = 9.375 -> 9; right edge 12.5 * 1.25 = 15.625 -> 16
		expect(fullBarWidth(10, 2.5, 1.25)).to.deep.equal({
			position: 9,
			length: 7,
		});
	});

	void it('leaves no gap between adjacent bars', () => {
		const barSpacing = 6;
		const half = barSpacing / 2;
		for (const dpr of [1, 1.25, 2, 3]) {
			for (let i = 0; i < 8; i++) {
				const current = fullBarWidth(i * barSpacing, half, dpr);
				const next = fullBarWidth((i + 1) * barSpacing, half, dpr);
				expect(current.position + current.length, `i ${i} dpr ${dpr}`).to.equal(
					next.position
				);
			}
		}
	});

	void it('returns a zero length for a zero half spacing', () => {
		expect(fullBarWidth(10, 0, 1)).to.deep.equal({ position: 10, length: 0 });
	});
});
