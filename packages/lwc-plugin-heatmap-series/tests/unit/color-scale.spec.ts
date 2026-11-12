import { expect } from 'chai';
import { describe, it } from 'node:test';

import { amountRatio, createColorScale } from '../../src/color-scale';
import { mixColors, parseNormalizedColor } from '../../src/color';

// Node has no DOM, so colors are read in the forms a canvas hands back.
const range = { min: 0, max: 100 };

void describe('amountRatio', () => {
	void it('is where the amount sits between the ends, clamped', () => {
		expect(amountRatio(25, 0, 100)).to.equal(0.25);
		expect(amountRatio(-5, 0, 100)).to.equal(0);
		expect(amountRatio(500, 0, 100)).to.equal(1);
		expect(amountRatio(25, 100, 0)).to.equal(0.75);
	});

	void it('splits at the value when the ends are equal, and is 0 for NaN', () => {
		expect(amountRatio(4, 5, 5)).to.equal(0);
		expect(amountRatio(5, 5, 5)).to.equal(1);
		expect(amountRatio(NaN, 0, 100)).to.equal(0);
	});
});

void describe('createColorScale', () => {
	void it('spreads its stops over the range in view by default', () => {
		const shader = createColorScale({ stops: ['#0000ff', '#ff0000'], steps: 3 });
		expect(shader(0, range)).to.equal('rgba(0, 0, 255, 1)');
		expect(shader(50, range)).to.equal('rgba(128, 0, 128, 1)');
		expect(shader(100, range)).to.equal('rgba(255, 0, 0, 1)');
		expect(shader(100, { min: 100, max: 300 })).to.equal('rgba(0, 0, 255, 1)');
	});

	void it('takes a fixed domain over the range in view, clamping beyond it', () => {
		const shader = createColorScale({ stops: ['#0000ff', '#ff0000'], domain: [40, 60], steps: 2 });
		expect(shader(0, range)).to.equal('rgba(0, 0, 255, 1)');
		expect(shader(100, range)).to.equal('rgba(255, 0, 0, 1)');
	});

	void it('reverses with a domain given high end first', () => {
		const shader = createColorScale({ stops: ['#0000ff', '#ff0000'], domain: [100, 0], steps: 2 });
		expect(shader(100, range)).to.equal('rgba(0, 0, 255, 1)');
	});

	void it('passes through every stop', () => {
		const shader = createColorScale({ stops: ['#0000ff', '#00ff00', '#ff0000'], steps: 3 });
		expect(shader(50, range)).to.equal('rgba(0, 255, 0, 1)');
	});

	void it('returns at most `steps` colors', () => {
		const shader = createColorScale({ stops: ['#0000ff', '#ff0000'], steps: 4 });
		const colors = new Set(Array.from({ length: 101 }, (_, amount) => shader(amount, range)));
		expect(colors.size).to.equal(4);
	});

	void it('keeps at least two steps, and falls back to 32 for steps that are not a number', () => {
		expect(new Set([0, 100].map(amount => createColorScale({ stops: ['#0000ff', '#ff0000'], steps: 0 })(amount, range))).size).to.equal(2);
		const shader = createColorScale({ stops: ['#0000ff', '#ff0000'], steps: NaN });
		expect(new Set(Array.from({ length: 101 }, (_, amount) => shader(amount, range))).size).to.equal(32);
	});

	void it('leaves out stops it cannot read, and is transparent with none', () => {
		expect(createColorScale({ stops: ['bogus', '#ff0000'] })(0, range)).to.equal('rgba(255, 0, 0, 1)');
		expect(createColorScale({ stops: [] })(0, range)).to.equal('transparent');
	});

	void it('ignores a domain that is not two finite numbers, and keeps a copy of one that is', () => {
		const loose = createColorScale({ stops: ['#0000ff', '#ff0000'], domain: [0, NaN], steps: 2 });
		expect(loose(100, { min: 100, max: 300 })).to.equal('rgba(0, 0, 255, 1)');
		const domain: [number, number] = [0, 100];
		const kept = createColorScale({ stops: ['#0000ff', '#ff0000'], domain, steps: 2 });
		domain[1] = 1000;
		expect(kept(100, range)).to.equal('rgba(255, 0, 0, 1)');
	});
});

void describe('color helpers', () => {
	void it('reads the forms a canvas hands back', () => {
		expect(parseNormalizedColor('#ff8000')).to.deep.equal([255, 128, 0, 1]);
		expect(parseNormalizedColor('rgba(1, 2, 3, 0.5)')).to.deep.equal([1, 2, 3, 0.5]);
		expect(parseNormalizedColor('red')).to.equal(null);
	});

	void it('mixes with premultiplied alpha, so a transparent end only fades the color', () => {
		expect(mixColors([0, 0, 0, 0], [0, 255, 0, 1], 0.5)).to.equal('rgba(0, 255, 0, 0.5)');
	});
});
