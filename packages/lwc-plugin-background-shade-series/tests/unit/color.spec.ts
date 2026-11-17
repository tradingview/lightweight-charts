import { expect } from 'chai';
import { describe, it } from 'node:test';

import { mixColors, parseNormalizedColor, shadeRatio } from '../../src/color';

void describe('parseNormalizedColor', () => {
	void it('reads the #rrggbb form a canvas gives an opaque color', () => {
		expect(parseNormalizedColor('#ff9800')).to.deep.equal([255, 152, 0, 1]);
		expect(parseNormalizedColor('#2962FF')).to.deep.equal([41, 98, 255, 1]);
	});

	void it('reads the rgba() form a canvas gives a translucent color, and rgb()', () => {
		expect(parseNormalizedColor('rgba(255, 152, 0, 0.5)')).to.deep.equal([255, 152, 0, 0.5]);
		expect(parseNormalizedColor('rgba(0, 0, 0, 0)')).to.deep.equal([0, 0, 0, 0]);
		expect(parseNormalizedColor('rgb(50, 50, 255)')).to.deep.equal([50, 50, 255, 1]);
	});

	void it('rejects anything else', () => {
		expect(parseNormalizedColor('hotpink')).to.equal(null);
		expect(parseNormalizedColor('#fff')).to.equal(null);
		expect(parseNormalizedColor('')).to.equal(null);
	});
});

void describe('shadeRatio', () => {
	void it('places a value between the bounds', () => {
		expect(shadeRatio(25, 0, 100)).to.equal(0.25);
	});

	void it('clamps values outside the bounds to the end colors', () => {
		expect(shadeRatio(-50, 0, 100)).to.equal(0);
		expect(shadeRatio(150, 0, 100)).to.equal(1);
	});

	void it('accepts the bounds in either order', () => {
		expect(shadeRatio(25, 100, 0)).to.equal(0.75);
	});

	void it('splits at the bound when both bounds are equal, instead of dividing by zero', () => {
		expect(shadeRatio(49, 50, 50)).to.equal(0);
		expect(shadeRatio(50, 50, 50)).to.equal(1);
		expect(shadeRatio(51, 50, 50)).to.equal(1);
	});
});

void describe('mixColors', () => {
	void it('returns the end colors at the ends', () => {
		expect(mixColors([0, 0, 255, 1], [255, 0, 0, 1], 0)).to.equal('rgba(0, 0, 255, 1)');
		expect(mixColors([0, 0, 255, 1], [255, 0, 0, 1], 1)).to.equal('rgba(255, 0, 0, 1)');
	});

	void it('mixes two opaque colors channel by channel', () => {
		expect(mixColors([0, 0, 255, 1], [255, 100, 0, 1], 0.5)).to.equal('rgba(128, 50, 128, 1)');
	});

	void it('mixes with premultiplied alpha, so a transparent end only fades the other out', () => {
		// 'transparent' reads back as transparent black.
		expect(mixColors([0, 0, 0, 0], [8, 153, 129, 1], 0.5)).to.equal('rgba(8, 153, 129, 0.5)');
		expect(mixColors([0, 0, 255, 0], [255, 100, 0, 1], 0.25)).to.equal('rgba(255, 100, 0, 0.25)');
		expect(mixColors([0, 0, 0, 0], [0, 0, 0, 0], 0.5)).to.equal('rgba(0, 0, 0, 0)');
	});
});
