import { expect } from 'chai';
import { describe, it } from 'node:test';

import {
	defaultOptions,
	mergeOptions,
	resolveOptions,
} from '../../src/options.js';

void describe('resolveOptions', () => {
	void it('fills in every default', () => {
		expect(resolveOptions()).to.deep.equal({
			text: '',
			horzAlign: 'left',
			vertAlign: 'top',
			horzMargin: 20,
			vertMargin: 10,
			font: 'bold 14px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
			lineHeight: undefined,
			color: '#131722',
			visible: true,
			zOrder: 'normal',
		});
		expect(resolveOptions()).to.deep.equal(defaultOptions);
	});

	void it('keeps the values which are set, including falsy ones', () => {
		const resolved = resolveOptions({ text: 'Title', visible: false, horzMargin: 0 });
		expect(resolved.text).to.equal('Title');
		expect(resolved.visible).to.equal(false);
		expect(resolved.horzMargin).to.equal(0);
	});

	void it("reads the legacy 'middle' alignment as 'center' on both axes", () => {
		const resolved = resolveOptions({ horzAlign: 'middle', vertAlign: 'middle' });
		expect(resolved.horzAlign).to.equal('center');
		expect(resolved.vertAlign).to.equal('center');
	});

	void it('returns a new object every time', () => {
		expect(resolveOptions()).to.not.equal(defaultOptions);
		expect(resolveOptions()).to.not.equal(resolveOptions());
	});
});

void describe('mergeOptions', () => {
	const base = resolveOptions({ text: 'Base', color: 'red', lineHeight: 30 });

	void it('changes only the options which are passed', () => {
		const merged = mergeOptions(base, { text: 'Changed' });
		expect(merged.text).to.equal('Changed');
		expect(merged.color).to.equal('red');
		expect(merged.lineHeight).to.equal(30);
	});

	void it('leaves an option passed as undefined unchanged', () => {
		const merged = mergeOptions(base, { color: undefined });
		expect(merged.color).to.equal('red');
	});

	void it('resets lineHeight to measured when it is passed as undefined', () => {
		const merged = mergeOptions(base, { lineHeight: undefined });
		expect(merged.lineHeight).to.equal(undefined);
	});

	void it("normalises the legacy 'middle' alignment", () => {
		const merged = mergeOptions(base, { vertAlign: 'middle' });
		expect(merged.vertAlign).to.equal('center');
	});

	void it('does not mutate its arguments', () => {
		const patch = { text: 'Patch' };
		const merged = mergeOptions(base, patch);
		expect(merged).to.not.equal(base);
		expect(base.text).to.equal('Base');
		expect(patch).to.deep.equal({ text: 'Patch' });
	});

	void it('treats a missing patch as no change', () => {
		expect(mergeOptions(base)).to.deep.equal(base);
	});
});
