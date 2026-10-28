import { expect } from 'chai';
import { describe, it } from 'node:test';

import { mergeOptions } from '@tradingview/lwc-toolkit/options/merge';

import { scatterChartDefaults } from '../../src/chart.js';
import { DEFAULT_SCATTER_PALETTE, defaultOptions, scatterOptionDefaults, underlyingSeriesDefaults } from '../../src/options.js';

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
