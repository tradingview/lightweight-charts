import { expect } from 'chai';
import { describe, it } from 'node:test';
import type { InternalHorzScaleItem, Mutable, TickMark, TickMarkWeightValue, TimeScalePoint } from 'lightweight-charts';

import {
	ScatterHorzScaleBehavior,
	ScatterXAxisOwner,
	claimScatterXAxis,
	isScatterHorzScaleBehavior,
	releaseScatterXAxis,
	scatterXAxis,
	setScatterXAxis,
} from '../../src/horz-scale-behavior.js';
import { ZERO_TICK_WEIGHT, buildSlotGrid, computeXDomain, niceStep, tickLevels, tickWeight } from '../../src/x-axis.js';

function timePoints(values: number[]): Mutable<TimeScalePoint>[] {
	return values.map((value: number) => ({
		time: value as unknown as InternalHorzScaleItem,
		originalTime: value,
		timeWeight: 0 as TickMarkWeightValue,
	}));
}

function tickMark(x: number): TickMark {
	return { time: x as unknown as InternalHorzScaleItem } as unknown as TickMark;
}

const localization = {} as Parameters<ScatterHorzScaleBehavior['formatTickmark']>[1];

void describe('ScatterHorzScaleBehavior', () => {
	void it('weighs time points with the grid and the label chain of the series', () => {
		const behavior = new ScatterHorzScaleBehavior();
		const grid = buildSlotGrid(computeXDomain(0.3, 89, { min: null, max: null }));
		const levels = tickLevels(grid, niceStep(20));
		setScatterXAxis(behavior, { grid, levels, ends: false, formatter: null });
		const points = timePoints([0, 5, 10, 20, 21]);
		behavior.fillWeightsForPoints(points, 0);
		expect(points.map(point => point.timeWeight)).to.deep.equal([0, 5, 10, 20, 21].map(x => tickWeight(grid, levels, x)));
		expect(points[0].timeWeight).to.equal(ZERO_TICK_WEIGHT);
	});

	void it('weighs the two ends above everything when only they are labelled', () => {
		const behavior = new ScatterHorzScaleBehavior();
		const grid = buildSlotGrid(computeXDomain(-1450, 1480, { min: null, max: null }));
		const levels = tickLevels(grid, grid.tickStep);
		setScatterXAxis(behavior, { grid, levels, ends: true, formatter: null });
		const points = timePoints([-1500, 0, 500, 1500]);
		behavior.fillWeightsForPoints(points, 0);
		expect(points.map(point => point.timeWeight)).to.deep.equal([ZERO_TICK_WEIGHT + 1, ZERO_TICK_WEIGHT, tickWeight(grid, levels, 500), ZERO_TICK_WEIGHT + 1]);
	});

	void it('weighs only the points from the start index', () => {
		const behavior = new ScatterHorzScaleBehavior();
		const points = timePoints([0, 10]);
		behavior.fillWeightsForPoints(points, 1);
		expect(points[0].timeWeight).to.equal(0);
		expect(points[1].timeWeight).to.be.greaterThan(0);
	});

	void it('formats with the grid decimals, or with the given formatter', () => {
		const behavior = new ScatterHorzScaleBehavior();
		const grid = buildSlotGrid(computeXDomain(0.001, 0.049, { min: null, max: null }));
		setScatterXAxis(behavior, { grid, levels: [], ends: false, formatter: null });
		expect(behavior.formatTickmark(tickMark(0.1 + 0.2), localization)).to.equal('0.3');
		expect(behavior.formatTickmark(tickMark(0.035), localization)).to.equal('0.035');
		setScatterXAxis(behavior, { grid, levels: [], ends: false, formatter: (x: number) => `${x}Y` });
		expect(behavior.formatTickmark(tickMark(5), localization)).to.equal('5Y');
		expect(behavior.formatHorzItem(5 as unknown as InternalHorzScaleItem)).to.equal('5Y');
	});

	void it('uses numbers as their own keys', () => {
		const behavior = new ScatterHorzScaleBehavior();
		expect(behavior.key(12.5)).to.equal(12.5);
		expect(behavior.convertHorzItemToInternal(-3)).to.equal(-3);
		expect(isScatterHorzScaleBehavior(behavior)).to.equal(true);
		expect(isScatterHorzScaleBehavior({ setScatterXAxis: () => undefined })).to.equal(false);
		expect(isScatterHorzScaleBehavior(null)).to.equal(false);
	});

	void it('takes one scatter series, and another once the first is released', () => {
		const behavior = new ScatterHorzScaleBehavior();
		const owner = (): ScatterXAxisOwner & { released: number } => ({
			released: 0,
			attached: () => true,
			release(): void { this.released++; },
		});
		const first = owner();
		const second = owner();
		claimScatterXAxis(behavior, first);
		claimScatterXAxis(behavior, first);
		expect(() => claimScatterXAxis(behavior, second)).to.throw(/already has a scatter series/);
		expect(first.released).to.equal(0);
		const grid = buildSlotGrid(computeXDomain(0, 10, { min: null, max: null }));
		setScatterXAxis(behavior, { grid, levels: [], ends: false, formatter: null });
		// Releasing by another owner changes nothing.
		releaseScatterXAxis(behavior, second);
		expect(scatterXAxis(behavior).grid).to.equal(grid);
		releaseScatterXAxis(behavior, first);
		expect(scatterXAxis(behavior).grid).to.equal(null);
		claimScatterXAxis(behavior, second);
	});

	void it('releases an owner whose series was taken off the chart directly', () => {
		const behavior = new ScatterHorzScaleBehavior();
		let released = 0;
		const detached: ScatterXAxisOwner = {
			attached: () => false,
			release: () => {
				released++;
				releaseScatterXAxis(behavior, detached);
			},
		};
		claimScatterXAxis(behavior, detached);
		const next: ScatterXAxisOwner = { attached: () => true, release: () => undefined };
		claimScatterXAxis(behavior, next);
		expect(released).to.equal(1);
		expect(() => claimScatterXAxis(behavior, detached)).to.throw(/already has a scatter series/);
	});

	void it('publishes nothing but the horizontal scale behaviour', () => {
		const methods = Object.getOwnPropertyNames(ScatterHorzScaleBehavior.prototype).sort();
		expect(methods).to.deep.equal([
			'cacheKey',
			'constructor',
			'convertHorzItemToInternal',
			'createConverterToInternalObj',
			'fillWeightsForPoints',
			'formatHorzItem',
			'formatTickmark',
			'key',
			'maxTickMarkWeight',
			'options',
			'preprocessData',
			'setOptions',
			'updateFormatter',
		]);
	});
});
