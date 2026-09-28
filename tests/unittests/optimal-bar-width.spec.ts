/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { optimalCandlestickWidth } from '../../src/renderers/optimal-bar-width';

describe('optimalCandlestickWidth', () => {
	it('should not exceed the bar spacing so adjacent candles do not overlap', () => {
		for (const pixelRatio of [1, 1.25, 1.5, 2, 2.5, 3]) {
			for (let barSpacing = 0.5; barSpacing <= 50; barSpacing += 0.05) {
				const width = optimalCandlestickWidth(barSpacing, pixelRatio);
				const limit = Math.max(Math.floor(pixelRatio), Math.floor(barSpacing * pixelRatio));
				expect(width, `barSpacing=${barSpacing}, pixelRatio=${pixelRatio}`).to.be.at.most(limit);
			}
		}
	});

	it('should keep the special case width when it fits into the bar spacing', () => {
		expect(optimalCandlestickWidth(3, 1)).to.be.equal(3);
		expect(optimalCandlestickWidth(4, 2)).to.be.equal(6);
	});

	it('should clamp the special case width to the bar spacing', () => {
		expect(optimalCandlestickWidth(2.7, 1)).to.be.equal(2);
		expect(optimalCandlestickWidth(2.7, 2)).to.be.equal(5);
	});
});
