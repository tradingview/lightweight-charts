import { expect } from 'chai';
import { describe, it } from 'node:test';

import { AccessibilityCommand, KeyBindings, commandForKey } from '../../src/keyboard';

function press(key: string, extra: { code?: string; shiftKey?: boolean } = {}, bindings?: KeyBindings): AccessibilityCommand | null {
	return commandForKey({ key, ...extra }, bindings);
}

void describe('commandForKey', () => {
	void it('maps the arrow keys to point and series moves', () => {
		expect(press('ArrowRight')).to.equal('nextPoint');
		expect(press('ArrowLeft')).to.equal('previousPoint');
		expect(press('ArrowUp')).to.equal('previousSeries');
		expect(press('ArrowDown')).to.equal('nextSeries');
	});

	void it('follows the ARIA slider convention for Page Up / Down', () => {
		expect(press('PageUp')).to.equal('pageForward');
		expect(press('PageDown')).to.equal('pageBack');
	});

	void it('maps Home and End to the series ends', () => {
		expect(press('Home')).to.equal('firstPoint');
		expect(press('End')).to.equal('lastPoint');
	});

	void it('accepts the unshifted zoom aliases', () => {
		expect(press('+')).to.equal('zoomIn');
		expect(press('=')).to.equal('zoomIn');
		expect(press('-')).to.equal('zoomOut');
		expect(press('_')).to.equal('zoomOut');
	});

	void it('maps Enter, Space, either case of H, T and Escape', () => {
		expect(press('Enter')).to.equal('summary');
		expect(press(' ')).to.equal('summary');
		expect(press('h')).to.equal('help');
		expect(press('H')).to.equal('help');
		expect(press('t')).to.equal('viewAsTable');
		expect(press('T')).to.equal('viewAsTable');
		expect(press('Escape')).to.equal('closePanels');
	});

	void it('falls back to the physical key on a non-Latin layout', () => {
		// A Russian layout produces 'р' on the physical H key.
		expect(press('р', { code: 'KeyH' })).to.equal('help');
		expect(press('е', { code: 'KeyT' })).to.equal('viewAsTable');
		// `key` still wins where it maps to something.
		expect(press('ArrowRight', { code: 'KeyH' })).to.equal('nextPoint');
	});

	void it('leaves Shift chords to the screen reader, but keeps shifted characters', () => {
		expect(press('ArrowRight', { shiftKey: true })).to.equal(null);
		expect(press('Home', { shiftKey: true })).to.equal(null);
		expect(press('+', { shiftKey: true, code: 'Equal' })).to.equal('zoomIn');
		expect(press('T', { shiftKey: true, code: 'KeyT' })).to.equal('viewAsTable');
	});

	void it('lets keyBindings add, replace and remove bindings', () => {
		const bindings: KeyBindings = { s: 'summary', ArrowRight: 'lastPoint', h: null };
		expect(press('s', {}, bindings)).to.equal('summary');
		expect(press('ArrowRight', {}, bindings)).to.equal('lastPoint');
		expect(press('h', {}, bindings)).to.equal(null);
		// A code-based binding works too, and does not affect the built-ins.
		expect(press('ф', { code: 'KeyA' }, { KeyA: 'firstPoint' })).to.equal('firstPoint');
		expect(press('End', {}, bindings)).to.equal('lastPoint');
	});

	void it('ignores every other key', () => {
		expect(press('Tab')).to.equal(null);
		expect(press('a')).to.equal(null);
		expect(press('')).to.equal(null);
		// Not an inherited Object.prototype member either.
		expect(press('toString')).to.equal(null);
		expect(press('x', {}, { toString: 'summary' } as unknown as KeyBindings)).to.equal(null);
	});
});
