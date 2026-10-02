import { expect } from 'chai';
import { describe, it } from 'node:test';

import { normalizeValue } from '../../src/sonification';

void describe('normalizeValue', () => {
	void it('maps a value onto 0…1 within the range', () => {
		expect(normalizeValue(5, 0, 10)).to.equal(0.5);
		expect(normalizeValue(0, 0, 10)).to.equal(0);
		expect(normalizeValue(10, 0, 10)).to.equal(1);
		expect(normalizeValue(-5, -10, 10)).to.equal(0.25);
	});

	void it('is the middle of the scale for a flat series', () => {
		expect(normalizeValue(3, 3, 3)).to.equal(0.5);
	});
});
