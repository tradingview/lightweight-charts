import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { X_AXIS_MOVE_FLAGS, canMoveXAxis } from '../../src/scatter-series-api.js';

/**
 * The flags the library's time scale checks to treat both edges as fixed (all
 * scrolling and scaling off), read from its source: the series must know the
 * same ones, or it misjudges which end labels the chart moves inside the plot
 * and whether the user can leave the fit.
 */
function libraryFlags(): { handleScroll: string[]; handleScale: string[] } {
	const source = readFileSync(new URL('../../../../src/model/time-scale.ts', import.meta.url), 'utf-8');
	const body = /private _isAllScalingAndScrollingDisabled\(\): boolean \{([\s\S]*?)\n\t\}/.exec(source);
	expect(body, '_isAllScalingAndScrollingDisabled in src/model/time-scale.ts').to.not.equal(null);
	const flags = (name: string): string[] => Array.from((body as RegExpExecArray)[1].matchAll(new RegExp(`${name}\\.(\\w+)`, 'g')), (match: RegExpMatchArray) => match[1]);
	return { handleScroll: flags('handleScroll'), handleScale: flags('handleScale') };
}

void describe('canMoveXAxis', () => {
	void it('knows the flags the library treats both edges as fixed without', () => {
		const library = libraryFlags();
		expect(library.handleScroll.length).to.be.greaterThan(0);
		expect([...X_AXIS_MOVE_FLAGS.handleScroll].sort()).to.deep.equal([...library.handleScroll].sort());
		expect([...X_AXIS_MOVE_FLAGS.handleScale].sort()).to.deep.equal([...library.handleScale].sort());
	});

	void it('reads booleans and the flags of either option, the time axis only for the axis flags', () => {
		const off = {
			handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
			handleScale: {
				mouseWheel: false,
				pinch: false,
				axisPressedMouseMove: { time: false, price: true },
				axisDoubleClickReset: { time: false, price: true },
			},
		};
		expect(canMoveXAxis(off)).to.equal(false);
		expect(canMoveXAxis({ handleScroll: false, handleScale: false })).to.equal(false);
		expect(canMoveXAxis({ handleScroll: true, handleScale: false })).to.equal(true);
		for (const key of X_AXIS_MOVE_FLAGS.handleScroll) {
			expect(canMoveXAxis({ ...off, handleScroll: { ...off.handleScroll, [key]: true } }), key).to.equal(true);
		}
		for (const key of X_AXIS_MOVE_FLAGS.handleScale) {
			const on = key.startsWith('axis') ? { time: true, price: false } : true;
			expect(canMoveXAxis({ ...off, handleScale: { ...off.handleScale, [key]: on } }), key).to.equal(true);
		}
	});
});
