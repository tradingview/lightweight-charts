import { expect } from 'chai';
import { describe, it } from 'node:test';

import { defaultOptions } from '../../src/rounded-candles-series.js';
import { resolveRadius } from '../../src/radius.js';

void describe('resolveRadius', () => {
	void it('passes a constant radius through, whatever the bar spacing', () => {
		expect(resolveRadius(6, 3)).to.equal(6);
		expect(resolveRadius(6, 30)).to.equal(6);
	});

	void it('keeps a constant zero, rather than treating it as unset', () => {
		expect(resolveRadius(0, 12)).to.equal(0);
	});

	void it('calls a function radius with the bar spacing', () => {
		const seen: number[] = [];
		const radius = (barSpacing: number): number => {
			seen.push(barSpacing);
			return barSpacing / 4;
		};
		expect(resolveRadius(radius, 12)).to.equal(3);
		expect(seen).to.deep.equal([12]);
	});

	void it('resolves the default: square candles below a bar spacing of 4', () => {
		expect(resolveRadius(defaultOptions.radius, 3.9)).to.equal(0);
		expect(resolveRadius(defaultOptions.radius, 12)).to.equal(4);
	});
});
