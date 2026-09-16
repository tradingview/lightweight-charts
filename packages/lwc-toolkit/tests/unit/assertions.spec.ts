import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ensureDefined, ensureNotNull } from '../../src/assertions.js';

void describe('ensureDefined', () => {
	void it('returns the value unchanged', () => {
		const value = { a: 1 };
		expect(ensureDefined(value)).to.equal(value);
		expect(ensureDefined(0)).to.equal(0);
		expect(ensureDefined('')).to.equal('');
		expect(ensureDefined(false)).to.equal(false);
		expect(ensureDefined(NaN)).to.satisfy(Number.isNaN);
	});

	void it('throws "Value is undefined" for undefined', () => {
		expect(() => ensureDefined(undefined)).to.throw(
			Error,
			'Value is undefined'
		);
	});

	void it('lets null through: it only checks for undefined', () => {
		expect(ensureDefined(null)).to.equal(null);
	});
});

void describe('ensureNotNull', () => {
	void it('returns the value unchanged', () => {
		const value = [1, 2];
		expect(ensureNotNull(value)).to.equal(value);
		expect(ensureNotNull(0)).to.equal(0);
		expect(ensureNotNull('')).to.equal('');
		expect(ensureNotNull(false)).to.equal(false);
	});

	void it('throws "Value is null" for null', () => {
		expect(() => ensureNotNull(null)).to.throw(Error, 'Value is null');
	});

	void it('lets undefined through: it only checks for null', () => {
		expect(ensureNotNull(undefined)).to.equal(undefined);
	});
});
