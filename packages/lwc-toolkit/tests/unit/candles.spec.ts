import { expect } from 'chai';
import { describe, it } from 'node:test';

import { candlestickWidth } from '../../src/dimensions/candles.js';

void describe('candlestickWidth', () => {
	void it('reserves a one pixel gap at DPR 1 (barSpacing 6 gives 5)', () => {
		expect(candlestickWidth(6, 1)).to.equal(5);
	});

	void it('scales with the pixel ratio (barSpacing 6, DPR 2 gives 10)', () => {
		expect(candlestickWidth(6, 2)).to.equal(10);
	});

	void it('matches the wick parity, dropping a pixel if needed (barSpacing 6, DPR 1.25 gives 5 not 6)', () => {
		// wick width is floor(1.25) === 1 (odd), so the even 6 is reduced to 5
		expect(candlestickWidth(6, 1.25)).to.equal(5);
	});

	void it('always shares parity with the wick width once the body is 2px or wider', () => {
		for (const dpr of [1, 1.25, 2, 3]) {
			const wickWidth = Math.floor(dpr);
			for (let barSpacing = 0.5; barSpacing <= 40; barSpacing += 0.25) {
				const width = candlestickWidth(barSpacing, dpr);
				if (width >= 2) {
					expect(
						width % 2,
						`barSpacing ${barSpacing} dpr ${dpr} width ${width}`
					).to.equal(wickWidth % 2);
				}
			}
		}
	});

	void it('uses the fixed 3 * pixelRatio special case for barSpacing between 2.5 and 4', () => {
		expect(candlestickWidth(2.5, 1)).to.equal(3);
		expect(candlestickWidth(3, 1)).to.equal(3);
		expect(candlestickWidth(4, 1)).to.equal(3);
		expect(candlestickWidth(3, 2)).to.equal(6);
		// floor(3 * 1.25) === 3, and it already matches the odd wick
		expect(candlestickWidth(3, 1.25)).to.equal(3);
	});

	void it('never goes below floor(pixelRatio) at very small bar spacings', () => {
		expect(candlestickWidth(0.5, 1)).to.equal(1);
		expect(candlestickWidth(0.5, 2)).to.equal(2);
		expect(candlestickWidth(1, 1)).to.equal(1);
		expect(candlestickWidth(1, 2)).to.equal(2);
		// barSpacing 2 falls just below the special case, so it stays 1px
		expect(candlestickWidth(2, 1)).to.equal(1);
	});

	void it('grows sub-linearly at wide bar spacings', () => {
		expect(candlestickWidth(20, 1)).to.equal(15);
		expect(candlestickWidth(20, 2)).to.equal(32);
		expect(candlestickWidth(20, 1.25)).to.equal(19);
	});

	void it('never exceeds floor(barSpacing * pixelRatio) above the special case', () => {
		for (const dpr of [1, 1.25, 2]) {
			for (const barSpacing of [5, 6, 8, 12, 20, 40]) {
				expect(
					candlestickWidth(barSpacing, dpr),
					`barSpacing ${barSpacing} dpr ${dpr}`
				).to.be.at.most(Math.floor(barSpacing * dpr));
			}
		}
	});
});
