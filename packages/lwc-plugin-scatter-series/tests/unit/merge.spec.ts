import { expect } from 'chai';
import { describe, it } from 'node:test';

import { scatterChartDefaults } from '../../src/chart.js';
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

	void it('skips __proto__, constructor and prototype keys, as JSON.parse makes them', () => {
		const source = JSON.parse('{"__proto__": {"polluted": true}, "range": {"__proto__": {"x": 1}, "min": 2}, "constructor": 3}') as Record<string, unknown>;
		const merged = mergeOptions({ range: { min: 0, max: 1 } }, source) as Record<string, unknown> & { range: Record<string, unknown> };
		expect(Object.getPrototypeOf(merged)).to.equal(Object.prototype);
		expect(Object.getPrototypeOf(merged.range)).to.equal(Object.prototype);
		expect(merged.polluted).to.equal(undefined);
		expect(Object.prototype.hasOwnProperty.call(merged, 'constructor')).to.equal(false);
		expect(merged.range).to.deep.equal({ min: 2, max: 1 });
		const cloned = cloneOptions(source) as Record<string, unknown>;
		expect(Object.getPrototypeOf(cloned)).to.equal(Object.prototype);
		expect(({} as Record<string, unknown>).polluted).to.equal(undefined);
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

	void it('of the scatter chart are frozen too, and in the form the chart keeps, so that it never rewrites them', () => {
		expect(Object.isFrozen(scatterChartDefaults)).to.equal(true);
		expect(Object.isFrozen(scatterChartDefaults.timeScale)).to.equal(true);
		expect(Object.isFrozen(scatterChartDefaults.handleScale)).to.equal(true);
		expect(() => {
			(scatterChartDefaults.timeScale as { fixLeftEdge: boolean }).fixLeftEdge = false;
		}).to.throw(TypeError);
		// The chart replaces a boolean handleScroll / handleScale, and a boolean
		// axis flag, in the options object it is given: none may be left.
		expect(typeof scatterChartDefaults.handleScroll).to.equal('object');
		expect(typeof scatterChartDefaults.handleScale).to.equal('object');
		const scale = scatterChartDefaults.handleScale as { axisPressedMouseMove: unknown; axisDoubleClickReset: unknown };
		expect(typeof scale.axisPressedMouseMove).to.equal('object');
		expect(typeof scale.axisDoubleClickReset).to.equal('object');
		// Every flag off: no scrolling or zooming.
		const flags = JSON.stringify([scatterChartDefaults.handleScroll, scatterChartDefaults.handleScale]);
		expect(flags).to.not.include('true');
		// A host switching one flag on gets that one only.
		const merged = mergeOptions(scatterChartDefaults, { handleScale: { mouseWheel: true } });
		expect(merged.handleScale).to.deep.equal({
			axisPressedMouseMove: { time: false, price: false },
			axisDoubleClickReset: { time: false, price: false },
			mouseWheel: true,
			pinch: false,
		});
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
