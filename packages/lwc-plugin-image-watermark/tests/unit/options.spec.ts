import { expect } from 'chai';
import { describe, it } from 'node:test';

import { mergeOptions, resolveOptions } from '../../src/options.js';

void describe('resolveOptions', () => {
	void it('fills in every default', () => {
		expect(resolveOptions()).to.deep.equal({
			imageUrl: '',
			position: 'center',
			objectFit: 'contain',
			maxWidth: undefined,
			maxHeight: undefined,
			padding: 0,
			alpha: 1,
			visible: true,
			zOrder: 'bottom',
			crossOrigin: undefined,
			onError: undefined,
		});
	});

	void it('keeps the values which are set, including falsy ones', () => {
		const resolved = resolveOptions({ alpha: 0, visible: false, padding: 12 });
		expect(resolved.alpha).to.equal(0);
		expect(resolved.visible).to.equal(false);
		expect(resolved.padding).to.equal(12);
	});
});

void describe('mergeOptions', () => {
	void it('leaves an option which is not passed unchanged', () => {
		const base = resolveOptions({ alpha: 0.4, padding: 8 });
		const merged = mergeOptions(base, { padding: 20 });
		expect(merged.alpha).to.equal(0.4);
		expect(merged.padding).to.equal(20);
	});

	void it('treats an explicit undefined as "unchanged"', () => {
		const base = resolveOptions({ maxWidth: 100 });
		expect(mergeOptions(base, { maxWidth: undefined }).maxWidth).to.equal(100);
	});

	void it('does not modify the base', () => {
		const base = resolveOptions({ alpha: 0.4 });
		mergeOptions(base, { alpha: 1 });
		expect(base.alpha).to.equal(0.4);
	});
});
