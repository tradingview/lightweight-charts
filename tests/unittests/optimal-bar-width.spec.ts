/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	optimalBarWidth,
	optimalCandlestickWidth,
} from '../../src/renderers/optimal-bar-width';

describe('optimalCandlestickWidth', () => {
	it('keeps the upstream behaviour when no width is given', () => {
		// The special case for small spacings.
		expect(optimalCandlestickWidth(4, 1)).to.equal(3);
		expect(optimalCandlestickWidth(2.5, 1)).to.equal(3);
		// Beyond the special case the width follows the spacing.
		expect(optimalCandlestickWidth(6, 1)).to.equal(5);
		expect(optimalCandlestickWidth(10, 1)).to.equal(8);
	});

	it('scales the width with the pixel ratio', () => {
		expect(optimalCandlestickWidth(6, 2)).to.equal(10);
		expect(optimalCandlestickWidth(4, 2)).to.equal(6);
	});

	it('uses the explicit width when it is given', () => {
		expect(optimalCandlestickWidth(6, 1, 2)).to.equal(2);
		expect(optimalCandlestickWidth(12, 1, 8)).to.equal(8);
		expect(optimalCandlestickWidth(4, 1, 1)).to.equal(1);
	});

	it('scales the explicit width with the pixel ratio', () => {
		expect(optimalCandlestickWidth(6, 2, 3)).to.equal(6);
	});

	it('clamps the explicit width to the bar spacing', () => {
		// A body wider than the space between two candles would overlap
		// its neighbours.
		expect(optimalCandlestickWidth(4, 1, 40)).to.equal(4);
		expect(optimalCandlestickWidth(6, 1, 40)).to.equal(6);
	});

	it('ignores an explicit width that is not a positive number', () => {
		expect(optimalCandlestickWidth(6, 1, 0)).to.equal(5);
		expect(optimalCandlestickWidth(6, 1, -3)).to.equal(5);
		expect(optimalCandlestickWidth(6, 1, Number.NaN)).to.equal(5);
	});

	it('never renders narrower than a single pixel', () => {
		expect(optimalCandlestickWidth(6, 1, 0.1)).to.equal(1);
	});
});

describe('optimalBarWidth', () => {
	it('is a third of the bar spacing', () => {
		expect(optimalBarWidth(6, 1)).to.equal(1);
		expect(optimalBarWidth(10, 1)).to.equal(3);
		expect(optimalBarWidth(10, 2)).to.equal(6);
	});
});
