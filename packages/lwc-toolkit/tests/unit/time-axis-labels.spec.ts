import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
	DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH,
	tickMarkCharactersForWidth,
	tickMarkMaxLabelWidth,
	tickMarkPixelsPerCharacter,
	timeAxisLabelFont,
} from '../../src/chart/time-axis-labels.js';

function options(allowBoldLabels: boolean): Parameters<typeof timeAxisLabelFont>[0] {
	return { layout: { fontSize: 12, fontFamily: 'Arial, sans-serif' }, timeScale: { allowBoldLabels } };
}

void describe('timeAxisLabelFont', () => {
	void it('is the regular font, and bold for the major labels while bold labels are allowed', () => {
		expect(timeAxisLabelFont(options(true))).to.equal('12px Arial, sans-serif');
		expect(timeAxisLabelFont(options(true), true)).to.equal('bold 12px Arial, sans-serif');
		expect(timeAxisLabelFont(options(false), true)).to.equal('12px Arial, sans-serif');
	});
});

void describe('tick mark label spacing', () => {
	void it("is the library's: (fontSize + 4) × 5 pixels per 8 characters", () => {
		expect(tickMarkPixelsPerCharacter(12)).to.equal(10);
		expect(tickMarkPixelsPerCharacter(20)).to.equal(15);
		expect(tickMarkMaxLabelWidth(8, 12)).to.equal(80);
		expect(tickMarkMaxLabelWidth(3, 20)).to.equal(45);
	});

	void it('counts an unset or zero length as the default of 8 characters', () => {
		expect(DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH).to.equal(8);
		expect(tickMarkMaxLabelWidth(undefined, 12)).to.equal(80);
		expect(tickMarkMaxLabelWidth(0, 12)).to.equal(80);
	});

	void it('gives 0, the default to the time scale, for a width of 0', () => {
		expect(tickMarkCharactersForWidth(0, 12)).to.equal(0);
		expect(tickMarkMaxLabelWidth(tickMarkCharactersForWidth(0, 12), 12)).to.equal(80);
	});

	void it('converts a width back to a fractional character count', () => {
		expect(tickMarkCharactersForWidth(25, 12)).to.equal(2.5);
		expect(tickMarkMaxLabelWidth(tickMarkCharactersForWidth(37, 16), 16)).to.be.closeTo(37, 1e-12);
	});

	void it('matches the arithmetic of the time scale in the library source', () => {
		// Fails when the library changes how it turns characters into pixels:
		// update `chart/time-axis-labels` with it.
		const source = readFileSync(new URL('../../../../src/model/time-scale.ts', import.meta.url), 'utf-8');
		expect(source).to.include(`const defaultTickMarkMaxCharacterLength = ${DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH};`);
		expect(source).to.include('const pixelsPer8Characters = (fontSize + 4) * 5;');
		expect(source).to.include('const pixelsPerCharacter = pixelsPer8Characters / defaultTickMarkMaxCharacterLength;');
		expect(source).to.include('pixelsPerCharacter * (this._options.tickMarkMaxCharacterLength || defaultTickMarkMaxCharacterLength)');
	});
});
