import { expect } from 'chai';
import { describe, it } from 'node:test';

import { cloneOptions, mergeOptions } from '../../src/merge.js';
import { DEFAULT_SCATTER_PALETTE, defaultOptions, scatterOptionDefaults, underlyingSeriesDefaults } from '../../src/options.js';

void describe('mergeOptions', () => {
	void it('shares no object or array with the target, even for keys the source leaves out', () => {
		const target = { range: { min: 1, max: 2 }, list: [{ id: 'a' }], border: { visible: false } };
		const merged = mergeOptions(target, { border: { visible: true } });
		merged.range.min = 10;
		merged.list[0].id = 'changed';
		merged.list.push({ id: 'b' });
		merged.border.visible = false;
		expect(target).to.deep.equal({ range: { min: 1, max: 2 }, list: [{ id: 'a' }], border: { visible: false } });
	});

	void it('shares no object or array with the source', () => {
		const source = { groups: [{ id: 'a', color: '#F23645' }], range: { min: 0, max: null as number | null } };
		const merged = mergeOptions({ groups: [], range: { min: null, max: null } }, source);
		source.groups[0].color = '#000000';
		source.groups.push({ id: 'b', color: '#000000' });
		source.range.max = 5;
		expect(merged).to.deep.equal({ groups: [{ id: 'a', color: '#F23645' }], range: { min: 0, max: null } });
	});

	void it('keeps functions as they are', () => {
		const formatter = (x: number): string => `${x}`;
		expect(mergeOptions({ formatter: null as unknown }, { formatter }).formatter).to.equal(formatter);
		expect(cloneOptions({ list: [formatter] }).list[0]).to.equal(formatter);
	});

	void it('still merges nested objects and replaces arrays', () => {
		const merged = mergeOptions(
			{ border: { visible: false, color: 'grey' }, palette: ['a', 'b'] },
			{ border: { visible: true }, palette: ['c'] }
		);
		expect(merged).to.deep.equal({ border: { visible: true, color: 'grey' }, palette: ['c'] });
	});
});

void describe('option defaults', () => {
	void it('cannot be changed through the options a series starts from', () => {
		const options = mergeOptions(scatterOptionDefaults, {});
		options.plotBorder.visible = true;
		options.sizeRange.max = 49;
		options.xRange.min = 3;
		(options.palette as string[])[0] = '#000000';
		(options.groups as unknown[]).push({ id: 'x' });
		expect(scatterOptionDefaults.plotBorder.visible).to.equal(false);
		expect(scatterOptionDefaults.sizeRange.max).to.equal(25);
		expect(scatterOptionDefaults.xRange.min).to.equal(null);
		expect(scatterOptionDefaults.groups).to.deep.equal([]);
		expect(DEFAULT_SCATTER_PALETTE[0]).to.equal('#2962FF');
	});

	void it('are frozen, so that a leak throws rather than corrupts', () => {
		expect(Object.isFrozen(scatterOptionDefaults)).to.equal(true);
		expect(Object.isFrozen(scatterOptionDefaults.plotBorder)).to.equal(true);
		expect(Object.isFrozen(scatterOptionDefaults.sizeRange)).to.equal(true);
		expect(Object.isFrozen(DEFAULT_SCATTER_PALETTE)).to.equal(true);
		expect(Object.isFrozen(underlyingSeriesDefaults.priceFormat)).to.equal(true);
	});

	void it('export defaultOptions as a copy of their own', () => {
		expect(defaultOptions.plotBorder).to.deep.equal(scatterOptionDefaults.plotBorder);
		expect(defaultOptions.plotBorder).to.not.equal(scatterOptionDefaults.plotBorder);
		expect(defaultOptions.palette).to.not.equal(DEFAULT_SCATTER_PALETTE);
		expect(defaultOptions.priceFormat).to.not.equal(underlyingSeriesDefaults.priceFormat);
		defaultOptions.sizeRange.max = 40;
		try {
			expect(scatterOptionDefaults.sizeRange.max).to.equal(25);
		} finally {
			defaultOptions.sizeRange.max = 25;
		}
	});
});
