import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	getDashPattern,
	LineStyle,
	setLineStyle,
} from '../../src/line-style.js';

interface FakeContext {
	patterns: number[][];
	lineWidth: number;
}

/**
 * Minimal `CanvasRenderingContext2D` stand-in which records every dash pattern
 * applied to it.
 */
function fakeContext(lineWidth: number): FakeContext & CanvasRenderingContext2D {
	const patterns: number[][] = [];
	return {
		patterns,
		lineWidth,
		setLineDash: (segments: number[]): void => {
			patterns.push(segments);
		},
	} as unknown as FakeContext & CanvasRenderingContext2D;
}

void describe('getDashPattern', () => {
	void it('gives a solid line no dash pattern', () => {
		expect(getDashPattern(LineStyle.Solid, 2)).to.deep.equal([]);
	});

	void it('scales every pattern by the line width', () => {
		expect(getDashPattern(LineStyle.Dotted, 1)).to.deep.equal([1, 1]);
		expect(getDashPattern(LineStyle.Dotted, 3)).to.deep.equal([3, 3]);
		expect(getDashPattern(LineStyle.Dashed, 2)).to.deep.equal([4, 4]);
		expect(getDashPattern(LineStyle.LargeDashed, 2)).to.deep.equal([12, 12]);
		expect(getDashPattern(LineStyle.SparseDotted, 2)).to.deep.equal([2, 8]);
	});

	void it('matches the numeric values the chart uses', () => {
		expect(getDashPattern(0, 1)).to.deep.equal([]);
		expect(getDashPattern(1, 1)).to.deep.equal([1, 1]);
		expect(getDashPattern(2, 1)).to.deep.equal([2, 2]);
		expect(getDashPattern(3, 1)).to.deep.equal([6, 6]);
		expect(getDashPattern(4, 1)).to.deep.equal([1, 4]);
	});

	void it('falls back to a solid line for an unknown style', () => {
		expect(getDashPattern(9 as LineStyle, 1)).to.deep.equal([]);
	});
});

void describe('setLineStyle', () => {
	void it('applies the pattern for the style to the context', () => {
		const ctx = fakeContext(1);
		setLineStyle(ctx, LineStyle.Dashed);
		expect(ctx.patterns).to.deep.equal([[2, 2]]);
	});

	void it('clears the dash pattern for a solid line', () => {
		const ctx = fakeContext(2);
		setLineStyle(ctx, LineStyle.Solid);
		expect(ctx.patterns).to.deep.equal([[]]);
	});

	void it('derives the dash lengths from the current line width', () => {
		const ctx = fakeContext(4);
		setLineStyle(ctx, LineStyle.Dotted);
		expect(ctx.patterns).to.deep.equal([[4, 4]]);
	});

	void it('leaves the pattern in media units by default', () => {
		const ctx = fakeContext(2);
		expect(setLineStyle(ctx, LineStyle.Dashed)).to.deep.equal([4, 4]);
	});

	void it('scales the pattern by the pixel ratio when one is given', () => {
		const ctx = fakeContext(2);
		expect(setLineStyle(ctx, LineStyle.Dashed, 2)).to.deep.equal([8, 8]);
		expect(ctx.patterns).to.deep.equal([[8, 8]]);
	});

	void it('handles a fractional pixel ratio', () => {
		const ctx = fakeContext(1);
		expect(setLineStyle(ctx, LineStyle.Dotted, 1.5)).to.deep.equal([1.5, 1.5]);
	});

	void it('returns the pattern it applied', () => {
		const ctx = fakeContext(1);
		const pattern = setLineStyle(ctx, LineStyle.SparseDotted);
		expect(pattern).to.deep.equal([1, 4]);
		expect(ctx.patterns[0]).to.deep.equal(pattern);
	});

	void it('applies a new pattern on every call', () => {
		const ctx = fakeContext(1);
		setLineStyle(ctx, LineStyle.Dashed);
		setLineStyle(ctx, LineStyle.Solid);
		expect(ctx.patterns).to.deep.equal([[2, 2], []]);
	});
});
