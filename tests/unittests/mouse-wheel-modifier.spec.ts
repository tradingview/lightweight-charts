/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { isMouseWheelModifierPressed, ModifierKeysState } from '../../src/gui/mouse-wheel-modifier';

const noKeys: ModifierKeysState = { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false };

describe('isMouseWheelModifierPressed', () => {
	it('returns true when no modifier key is required', () => {
		expect(isMouseWheelModifierPressed(noKeys, null)).to.equal(true);
		expect(isMouseWheelModifierPressed(noKeys, undefined)).to.equal(true);
	});

	it('returns false when the required key is not pressed', () => {
		expect(isMouseWheelModifierPressed(noKeys, 'ctrl')).to.equal(false);
		expect(isMouseWheelModifierPressed(noKeys, 'alt')).to.equal(false);
		expect(isMouseWheelModifierPressed(noKeys, 'shift')).to.equal(false);
		expect(isMouseWheelModifierPressed(noKeys, 'meta')).to.equal(false);
	});

	it('returns true only when the required key is pressed', () => {
		expect(isMouseWheelModifierPressed({ ...noKeys, ctrlKey: true }, 'ctrl')).to.equal(true);
		expect(isMouseWheelModifierPressed({ ...noKeys, altKey: true }, 'alt')).to.equal(true);
		expect(isMouseWheelModifierPressed({ ...noKeys, shiftKey: true }, 'shift')).to.equal(true);
		expect(isMouseWheelModifierPressed({ ...noKeys, metaKey: true }, 'meta')).to.equal(true);
		expect(isMouseWheelModifierPressed({ ...noKeys, shiftKey: true }, 'ctrl')).to.equal(false);
	});
});
