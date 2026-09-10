import { expect } from 'chai';
import { describe, it } from 'node:test';

import { commandForKey } from '../../src/keyboard';

void describe('commandForKey', () => {
	void it('maps the arrow keys to point and series moves', () => {
		expect(commandForKey('ArrowRight')).to.equal('nextPoint');
		expect(commandForKey('ArrowLeft')).to.equal('previousPoint');
		expect(commandForKey('ArrowUp')).to.equal('previousSeries');
		expect(commandForKey('ArrowDown')).to.equal('nextSeries');
	});

	void it('follows the ARIA slider convention for Page Up / Down', () => {
		expect(commandForKey('PageUp')).to.equal('pageForward');
		expect(commandForKey('PageDown')).to.equal('pageBack');
	});

	void it('maps Home and End to the series ends', () => {
		expect(commandForKey('Home')).to.equal('firstPoint');
		expect(commandForKey('End')).to.equal('lastPoint');
	});

	void it('accepts the unshifted zoom aliases', () => {
		expect(commandForKey('+')).to.equal('zoomIn');
		expect(commandForKey('=')).to.equal('zoomIn');
		expect(commandForKey('-')).to.equal('zoomOut');
		expect(commandForKey('_')).to.equal('zoomOut');
	});

	void it('maps Enter, Space and either case of H', () => {
		expect(commandForKey('Enter')).to.equal('summary');
		expect(commandForKey(' ')).to.equal('summary');
		expect(commandForKey('h')).to.equal('help');
		expect(commandForKey('H')).to.equal('help');
	});

	void it('ignores every other key', () => {
		expect(commandForKey('Tab')).to.equal(null);
		expect(commandForKey('a')).to.equal(null);
		expect(commandForKey('')).to.equal(null);
		// Not an inherited Object.prototype member either.
		expect(commandForKey('toString')).to.equal(null);
	});
});
