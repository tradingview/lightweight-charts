import { expect } from 'chai';
import { describe, it } from 'node:test';

import { AnchoredTextCore } from '../../src/core.js';
import { defaultOptions } from '../../src/options.js';

function createCore(options?: ConstructorParameters<typeof AnchoredTextCore>[1]) {
	let updates = 0;
	const core = new AnchoredTextCore(() => { updates++; }, options);
	return { core, updates: () => updates };
}

void describe('AnchoredTextCore', () => {
	void it('starts from the defaults', () => {
		const { core } = createCore();
		expect(core.options()).to.deep.equal(defaultOptions);
	});

	void it('applies the constructor options, reading middle as center', () => {
		const { core } = createCore({ text: 'Title', vertAlign: 'middle' });
		expect(core.options().text).to.equal('Title');
		expect(core.options().vertAlign).to.equal('center');
	});

	void it('returns a copy of its options', () => {
		const { core } = createCore();
		const options = core.options() as { text: string };
		options.text = 'Changed';
		expect(core.options().text).to.equal('');
	});

	void it('merges applied options and asks the chart to redraw once', () => {
		const { core, updates } = createCore({ text: 'Title', color: 'red' });
		core.applyOptions({ horzAlign: 'right' });
		expect(core.options()).to.include({ text: 'Title', color: 'red', horzAlign: 'right' });
		expect(updates()).to.equal(1);
	});

	void it('has one pane view whose layer follows zOrder', () => {
		const { core } = createCore({ text: 'Title' });
		expect(core.paneViews()).to.have.length(1);
		expect(core.paneViews()[0].zOrder?.()).to.equal('normal');
		core.applyOptions({ zOrder: 'bottom' });
		expect(core.paneViews()[0].zOrder?.()).to.equal('bottom');
	});

	void it('renders nothing while hidden or without text', () => {
		const { core } = createCore();
		expect(core.paneViews()[0].renderer()).to.equal(null);
		core.applyOptions({ text: 'Title' });
		expect(core.paneViews()[0].renderer()).to.not.equal(null);
		core.applyOptions({ visible: false });
		expect(core.paneViews()[0].renderer()).to.equal(null);
	});
});
