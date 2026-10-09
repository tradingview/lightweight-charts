import { expect } from 'chai';
import { describe, it } from 'node:test';

import type { AutoscaleInfo } from 'lightweight-charts';

import {
	applyOwnOptions,
	initialOwnOptions,
	optionChange,
	paintOptions,
	splitOptions,
} from '../../src/option-handling.js';
import { ScatterSeriesPartialOptions, scatterOptionDefaults, underlyingSeriesDefaults } from '../../src/options.js';

void describe('splitOptions', () => {
	void it('keeps the scatter options, and passes the others on to the series', () => {
		const split = splitOptions({ opacity: 0.5, visible: false, priceScaleId: 'left' });
		expect(split.scatter).to.deep.equal({ opacity: 0.5 });
		expect(split.base).to.deep.equal({ visible: false, priceScaleId: 'left' });
		expect(split.tolerance).to.equal(null);
		expect(split.autoscale).to.equal(null);
	});

	void it('turns a top-level null into the default, unless the default is null', () => {
		const split = splitOptions({ xRange: null, strokeColor: null } as unknown as ScatterSeriesPartialOptions);
		expect(split.scatter.xRange).to.equal(scatterOptionDefaults.xRange);
		expect(split.scatter.strokeColor).to.equal(null);
	});

	void it('keeps the tolerance and the autoscale provider, which the series handles itself', () => {
		const provider = (): AutoscaleInfo | null => null;
		expect(splitOptions({ hitTestTolerance: -2 }).tolerance).to.equal(0);
		expect(splitOptions({ hitTestTolerance: Number.NaN }).tolerance).to.equal(null);
		expect(splitOptions({ autoscaleInfoProvider: provider }).autoscale).to.deep.equal({ provider });
		expect(splitOptions({ autoscaleInfoProvider: undefined }).autoscale).to.deep.equal({ provider: undefined });
	});

	void it('skips keys which would change a prototype', () => {
		const split = splitOptions(JSON.parse('{"__proto__": {"opacity": 0}, "opacity": 0.3}') as ScatterSeriesPartialOptions);
		expect(split.scatter).to.deep.equal({ opacity: 0.3 });
		expect(Object.keys(split.base)).to.deep.equal([]);
	});
});

void describe('optionChange', () => {
	void it('lays the axis out for anything that may move the slots or the labels', () => {
		expect(optionChange(splitOptions({ xRange: { min: 0, max: 10 } }))).to.equal('axis');
		expect(optionChange(splitOptions({ groups: [], opacity: 0.5 }))).to.equal('axis');
	});

	void it('builds the model again for the look of the points, and a new colour', () => {
		expect(optionChange(splitOptions({ opacity: 0.5, hoveredOpacity: 1 }))).to.equal('style');
		expect(optionChange(splitOptions({ color: '#000000' }))).to.equal('style');
	});

	void it('only paints for the hover style, the plot border and options it does not handle', () => {
		expect(optionChange(splitOptions({ hoveredRingWidth: 2, plotBorder: { visible: true } }))).to.equal('paint');
		expect(optionChange(splitOptions({ visible: false, hitTestTolerance: 5 }))).to.equal('paint');
	});
});

void describe('own options', () => {
	void it('start from the defaults, and apply changes over the current ones', () => {
		const own = initialOwnOptions(splitOptions({ opacity: 0.5 }));
		expect(own.scatter.opacity).to.equal(0.5);
		expect(own.scatter.pointSize).to.equal(scatterOptionDefaults.pointSize);
		expect(own.scatter).to.not.equal(scatterOptionDefaults);
		expect(own.tolerance).to.equal(underlyingSeriesDefaults.hitTestTolerance);
		const next = applyOwnOptions(own, splitOptions({ xRange: { min: 5 }, hitTestTolerance: 7 }));
		expect(next.scatter.xRange).to.deep.equal({ min: 5, max: null });
		expect(next.scatter.opacity).to.equal(0.5);
		expect(next.tolerance).to.equal(7);
		expect(applyOwnOptions(next, splitOptions({ visible: false })).scatter).to.equal(next.scatter);
	});

	void it('paint with checked values', () => {
		const own = initialOwnOptions(splitOptions({ hoveredOpacity: 3, hoveredRingWidth: -1, hoveredRingGap: Number.NaN }));
		const paint = paintOptions(own);
		expect(paint.hoveredOpacity).to.equal(1);
		expect(paint.hoveredRingWidth).to.equal(0);
		expect(paint.hoveredRingGap).to.equal(scatterOptionDefaults.hoveredRingGap);
		expect(paint.hitTestTolerance).to.equal(own.tolerance);
	});
});
