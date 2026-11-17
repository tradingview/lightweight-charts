import { expect } from 'chai';
import { describe, it } from 'node:test';

import { BUTTON_HEIGHT, BUTTON_WIDTH, SHOW_DISTANCE, buttonRect, isInRect, lineLimit } from '../../src/geometry';
import { defaultOptions } from '../../src/options';

void describe('buttonRect', () => {
	void it('puts the button against the right edge, centered on the pointer', () => {
		expect(buttonRect(500, 100)).to.deep.equal({ left: 500 - BUTTON_WIDTH, top: 100 - BUTTON_HEIGHT / 2, width: BUTTON_WIDTH, height: BUTTON_HEIGHT });
	});

	void it('comes up before the pointer reaches it', () => {
		expect(SHOW_DISTANCE).to.be.greaterThan(BUTTON_WIDTH);
	});
});

void describe('isInRect', () => {
	void it('includes the edges', () => {
		const rect = buttonRect(500, 100);
		expect(isInRect(rect, rect.left, rect.top)).to.equal(true);
		expect(isInRect(rect, rect.left + rect.width, rect.top + rect.height)).to.equal(true);
		expect(isInRect(rect, rect.left - 1, 100)).to.equal(false);
		expect(isInRect(rect, 490, rect.top - 1)).to.equal(false);
	});
});

void describe('lineLimit', () => {
	void it('rounds down and keeps at least one line', () => {
		expect(lineLimit(3)).to.equal(3);
		expect(lineLimit(2.9)).to.equal(2);
		expect(lineLimit(0)).to.equal(1);
		expect(lineLimit(-5)).to.equal(1);
	});

	void it('means no limit for Infinity, the default, and for a value that is not a number', () => {
		expect(defaultOptions.maxLines).to.equal(Infinity);
		expect(lineLimit(Infinity)).to.equal(Infinity);
		expect(lineLimit(NaN)).to.equal(Infinity);
		expect(lineLimit('3')).to.equal(Infinity);
		expect(lineLimit(undefined)).to.equal(Infinity);
	});
});

void describe('defaultOptions', () => {
	void it('sets the crosshair mode and draws dashed black lines with their price label', () => {
		expect(defaultOptions.setCrosshairMode).to.equal(true);
		expect(defaultOptions.lineColor).to.equal('#000000');
		expect(defaultOptions.axisLabelVisible).to.equal(true);
	});
});
