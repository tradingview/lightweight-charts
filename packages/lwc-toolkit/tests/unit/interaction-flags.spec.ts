import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { TIME_SCALE_MOVE_FLAGS, canUserMoveTimeScale } from '../../src/chart/interaction-flags.js';

/**
 * The flags the library's time scale checks to treat both edges as fixed (all
 * scrolling and scaling off), read from its source as paths such as
 * `axisPressedMouseMove.time`: the helper must know the same ones, or a plugin
 * misjudges which end labels the chart moves inside the plot and whether the
 * user can move the time scale.
 */
function libraryFlags(): { handleScroll: string[]; handleScale: string[] } {
	const source = readFileSync(new URL('../../../../src/model/time-scale.ts', import.meta.url), 'utf-8');
	const body = /private _isAllScalingAndScrollingDisabled\(\): boolean \{([\s\S]*?)\n\t\}/.exec(source);
	expect(body, '_isAllScalingAndScrollingDisabled in src/model/time-scale.ts').to.not.equal(null);
	const flags = (name: string): string[] => Array.from(
		(body as RegExpExecArray)[1].matchAll(new RegExp(`${name}\\.(\\w+(?:\\.\\w+)*)`, 'g')),
		(match: RegExpMatchArray) => match[1]
	);
	return { handleScroll: flags('handleScroll'), handleScale: flags('handleScale') };
}

void describe('canUserMoveTimeScale', () => {
	void it('knows the flags the library treats both edges as fixed without', () => {
		const library = libraryFlags();
		expect(library.handleScroll.length).to.be.greaterThan(0);
		// The helper reads the `time` flag of an object-valued flag (the axis
		// flags), and the flag itself otherwise.
		const read = (keys: readonly string[], objectValued: readonly string[]): string[] =>
			keys.map((key: string) => (objectValued.includes(key) ? `${key}.time` : key)).sort();
		expect(read(TIME_SCALE_MOVE_FLAGS.handleScroll, [])).to.deep.equal([...library.handleScroll].sort());
		expect(read(TIME_SCALE_MOVE_FLAGS.handleScale, ['axisPressedMouseMove', 'axisDoubleClickReset']))
			.to.deep.equal([...library.handleScale].sort());
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
		expect(canUserMoveTimeScale(off)).to.equal(false);
		expect(canUserMoveTimeScale({ handleScroll: false, handleScale: false })).to.equal(false);
		expect(canUserMoveTimeScale({ handleScroll: true, handleScale: false })).to.equal(true);
		expect(canUserMoveTimeScale({ handleScroll: false, handleScale: true })).to.equal(true);
		for (const key of TIME_SCALE_MOVE_FLAGS.handleScroll) {
			expect(canUserMoveTimeScale({ ...off, handleScroll: { ...off.handleScroll, [key]: true } }), key).to.equal(true);
		}
		for (const key of TIME_SCALE_MOVE_FLAGS.handleScale) {
			const on = key.startsWith('axis') ? { time: true, price: false } : true;
			expect(canUserMoveTimeScale({ ...off, handleScale: { ...off.handleScale, [key]: on } }), key).to.equal(true);
		}
	});

	void it('takes a boolean axis flag for both axes', () => {
		const handleScale = { mouseWheel: false, pinch: false, axisPressedMouseMove: true, axisDoubleClickReset: false };
		expect(canUserMoveTimeScale({ handleScroll: false, handleScale })).to.equal(true);
	});
});
