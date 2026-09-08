import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	gridAndCrosshairBitmapWidth,
	gridAndCrosshairMediaWidth,
} from '../../src/dimensions/crosshair-width.js';

void describe('gridAndCrosshairBitmapWidth', () => {
	void it('is one bitmap pixel at DPR 1', () => {
		expect(gridAndCrosshairBitmapWidth(1)).to.equal(1);
	});

	void it('floors a fractional pixel ratio', () => {
		expect(gridAndCrosshairBitmapWidth(1.25)).to.equal(1);
		expect(gridAndCrosshairBitmapWidth(1.5)).to.equal(1);
		expect(gridAndCrosshairBitmapWidth(2.75)).to.equal(2);
	});

	void it('scales with whole pixel ratios', () => {
		expect(gridAndCrosshairBitmapWidth(2)).to.equal(2);
		expect(gridAndCrosshairBitmapWidth(3)).to.equal(3);
	});

	void it('never returns less than one pixel below DPR 1', () => {
		expect(gridAndCrosshairBitmapWidth(0.5)).to.equal(1);
		expect(gridAndCrosshairBitmapWidth(0)).to.equal(1);
	});
});

void describe('gridAndCrosshairMediaWidth', () => {
	void it('is one media pixel at DPR 1', () => {
		expect(gridAndCrosshairMediaWidth(1)).to.equal(1);
	});

	void it('is the bitmap width divided by the pixel ratio', () => {
		expect(gridAndCrosshairMediaWidth(1.25)).to.equal(0.8);
		expect(gridAndCrosshairMediaWidth(2)).to.equal(1);
		expect(gridAndCrosshairMediaWidth(3)).to.equal(1);
	});

	void it('exceeds one media pixel below DPR 1, because the bitmap width has a 1px floor', () => {
		expect(gridAndCrosshairMediaWidth(0.5)).to.equal(2);
	});

	void it('is Infinity at a pixel ratio of 0', () => {
		expect(gridAndCrosshairMediaWidth(0)).to.equal(Infinity);
	});
});
