import { expect } from 'chai';
import { describe, it } from 'node:test';

import type { AutoscaleInfo } from 'lightweight-charts';

import { pinnedYRange, scatterAutoscaleInfo } from '../../src/autoscale.js';
import type { ScatterBaseline } from '../../src/options.js';

const noHover = { hoveredSizeIncrease: 0, hoveredRingWidth: 0, hoveredRingGap: 1 };
const open = { min: null, max: null };

/** The chart's own range of the visible slots, with no margins of its own. */
function slots(minValue: number, maxValue: number): AutoscaleInfo {
	return { priceRange: { minValue, maxValue } };
}

function yBaseline(value: number): ScatterBaseline {
	return { axis: 'y', value };
}

void describe('pinnedYRange', () => {
	void it('keeps the finite ends and swaps them when reversed', () => {
		expect(pinnedYRange({ min: 1, max: 5 })).to.deep.equal({ min: 1, max: 5 });
		expect(pinnedYRange({ min: 5, max: 1 })).to.deep.equal({ min: 1, max: 5 });
		expect(pinnedYRange({ min: Number.NaN, max: 3 })).to.deep.equal({ min: null, max: 3 });
		expect(pinnedYRange({ min: 2, max: Number.POSITIVE_INFINITY })).to.deep.equal({ min: 2, max: null });
		expect(pinnedYRange(open)).to.deep.equal(open);
	});
});

void describe('scatterAutoscaleInfo', () => {
	void it('passes nothing through when there is no range at all', () => {
		expect(scatterAutoscaleInfo(null, { yBaselines: [], maxSize: 9 }, open, noHover)).to.equal(null);
	});

	void it('keeps room for the largest point at both open ends: half its size and a pixel', () => {
		const info = scatterAutoscaleInfo(slots(10, 20), { yBaselines: [], maxSize: 9 }, open, noHover);
		expect(info).to.deep.equal({ priceRange: { minValue: 10, maxValue: 20 }, margins: { above: 5.5, below: 5.5 } });
	});

	void it('adds the growth and the ring of a hovered point', () => {
		const hover = { hoveredSizeIncrease: 4, hoveredRingWidth: 2, hoveredRingGap: 1 };
		const info = scatterAutoscaleInfo(slots(10, 20), { yBaselines: [], maxSize: 10 }, open, hover);
		// 5 + 2 + (1 + 2) + 1.
		expect(info?.margins).to.deep.equal({ above: 11, below: 11 });
	});

	void it('keeps margins of the base which are larger', () => {
		const base = { ...slots(10, 20), margins: { above: 30, below: 1 } };
		const info = scatterAutoscaleInfo(base, { yBaselines: [], maxSize: 9 }, open, noHover);
		expect(info?.margins).to.deep.equal({ above: 30, below: 5.5 });
	});

	void it('widens the range to the horizontal baselines, with or without points', () => {
		const baselines = [yBaseline(-5), yBaseline(50)];
		expect(scatterAutoscaleInfo(slots(10, 20), { yBaselines: baselines, maxSize: 0 }, open, noHover)?.priceRange)
			.to.deep.equal({ minValue: -5, maxValue: 50 });
		expect(scatterAutoscaleInfo(null, { yBaselines: baselines, maxSize: 0 }, open, noHover)).to.deep.equal({
			priceRange: { minValue: -5, maxValue: 50 },
			margins: { above: 0, below: 0 },
		});
	});

	void it('pins the ends of yRange with no room, in either order', () => {
		const model = { yBaselines: [], maxSize: 9 };
		expect(scatterAutoscaleInfo(slots(10, 20), model, { min: 0, max: 100 }, noHover)).to.deep.equal({
			priceRange: { minValue: 0, maxValue: 100 },
			margins: { above: 0, below: 0 },
		});
		expect(scatterAutoscaleInfo(slots(10, 20), model, { min: 100, max: 0 }, noHover)?.priceRange)
			.to.deep.equal({ minValue: 0, maxValue: 100 });
		expect(scatterAutoscaleInfo(slots(10, 20), model, { min: 0, max: null }, noHover)).to.deep.equal({
			priceRange: { minValue: 0, maxValue: 20 },
			margins: { above: 5.5, below: 0 },
		});
	});

	void it('collapses onto a single pinned end beyond the data', () => {
		const model = { yBaselines: [], maxSize: 0 };
		expect(scatterAutoscaleInfo(slots(10, 20), model, { min: 50, max: null }, noHover)?.priceRange)
			.to.deep.equal({ minValue: 50, maxValue: 50 });
		expect(scatterAutoscaleInfo(slots(10, 20), model, { min: null, max: 5 }, noHover)?.priceRange)
			.to.deep.equal({ minValue: 5, maxValue: 5 });
	});
});
