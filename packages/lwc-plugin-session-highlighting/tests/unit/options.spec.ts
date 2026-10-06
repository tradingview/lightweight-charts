import { expect } from 'chai';
import { describe, it } from 'node:test';

import { defaultOptions, mergeOptions, resolveOptions } from '../../src/options.js';

void describe('resolveOptions', () => {
	void it('fills in every default', () => {
		expect(resolveOptions()).to.deep.equal({ visible: true, zOrder: 'bottom' });
		expect(resolveOptions()).to.deep.equal(defaultOptions);
	});

	void it('keeps the values which are set, including falsy ones', () => {
		expect(resolveOptions({ visible: false, zOrder: 'top' })).to.deep.equal({ visible: false, zOrder: 'top' });
	});

	void it('returns a new object every time', () => {
		expect(resolveOptions()).to.not.equal(defaultOptions);
	});
});

void describe('mergeOptions', () => {
	const base = resolveOptions({ zOrder: 'normal' });

	void it('changes only the options which are passed', () => {
		expect(mergeOptions(base, { visible: false })).to.deep.equal({ visible: false, zOrder: 'normal' });
	});

	void it('leaves an option passed as undefined unchanged', () => {
		expect(mergeOptions(base, { zOrder: undefined })).to.deep.equal(base);
	});

	void it('does not mutate its arguments', () => {
		const patch = { zOrder: 'top' as const };
		const merged = mergeOptions(base, patch);
		expect(merged).to.not.equal(base);
		expect(base.zOrder).to.equal('normal');
		expect(patch).to.deep.equal({ zOrder: 'top' });
	});
});
