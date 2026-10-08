import { expect } from 'chai';
import { describe, it } from 'node:test';

import type { ScatterRange } from '../../src/options.js';
import {
	MAX_SLOT_COUNT,
	MAX_X_MAGNITUDE,
	NiceStep,
	SlotGrid,
	TickLevel,
	XAxisGeometry,
	XAxisLabels,
	ZERO_TICK_WEIGHT,
	buildSlotGrid,
	chooseXLabels,
	computeXDomain,
	fallbackTickWeight,
	formatXValue,
	isDrawableX,
	labelStepCandidates,
	niceStep,
	sameLevels,
	slotIndexOf,
	slotStepFor,
	slotValue,
	stepDecimals,
	stepRatio,
	stepValue,
	tickLevels,
	tickWeight,
} from '../../src/x-axis.js';

const open: ScatterRange = { min: null, max: null };

function value(step: NiceStep): number {
	return stepValue(step);
}

/**
 * The labels the chart picks with `uniformDistribution`, as slot indices:
 * weights from the heaviest down, each weight placed entirely while every
 * label stays at least `minIndices` slots from its neighbours, stopping at the
 * first weight that does not fit (the algorithm of the library's `TickMarks`).
 *
 * This re-implements the library's tick picking to state the intent the label
 * choice is built on; it cannot notice the library changing. The guard against
 * that is `tests/interactions/x-labels-narrow.js` (and `x-labels-zoomed.js`),
 * which measure the text the chart actually draws.
 */
function pickSlots(grid: SlotGrid, levels: readonly TickLevel[], minIndices: number, ends: boolean = false): number[] {
	const weights = new Map<number, number[]>();
	for (let slot = 0; slot < grid.count; slot++) {
		const weight = tickWeight(grid, levels, slotValue(grid, slot), ends);
		weights.set(weight, [...(weights.get(weight) ?? []), slot]);
	}
	let picked: number[] = [];
	for (const weight of [...weights.keys()].sort((a: number, b: number) => b - a)) {
		const next = [...picked, ...(weights.get(weight) as number[])].sort((a: number, b: number) => a - b);
		const fits = next.every((slot: number, i: number) => i === 0 || slot - next[i - 1] >= minIndices);
		if (!fits) {
			break;
		}
		picked = next;
	}
	return picked;
}

function pickLabels(grid: SlotGrid, levels: readonly TickLevel[], minIndices: number): number[] {
	return pickSlots(grid, levels, minIndices).map((slot: number) => slotValue(grid, slot));
}

function isEvenlySpaced(values: readonly number[]): boolean {
	const steps = values.slice(1).map((v: number, i: number) => v - values[i]);
	return steps.every((step: number) => Math.abs(step - steps[0]) < 1e-9 * Math.max(1, Math.abs(steps[0])));
}

/** The label chain of a grid labelled at its tick step. */
function tickStepLevels(grid: SlotGrid): TickLevel[] {
	return tickLevels(grid, grid.tickStep);
}

void describe('niceStep', () => {
	void it('rounds up to 1, 2 or 5 times a power of ten', () => {
		expect(value(niceStep(0.3))).to.equal(0.5);
		expect(value(niceStep(1))).to.equal(1);
		expect(value(niceStep(1.2))).to.equal(2);
		expect(value(niceStep(2))).to.equal(2);
		expect(value(niceStep(8.87))).to.equal(10);
		expect(value(niceStep(0.0048))).to.equal(0.005);
		expect(value(niceStep(293))).to.equal(500);
	});

	void it('does not overshoot on floating point noise', () => {
		expect(value(niceStep(0.1 + 0.2))).to.equal(0.5);
		expect(value(niceStep(0.2 + 1e-12))).to.equal(0.2);
		expect(value(niceStep(1000.0000001))).to.equal(1000);
	});

	void it('falls back to 1 for a step which is not a positive number', () => {
		expect(value(niceStep(0))).to.equal(1);
		expect(value(niceStep(-3))).to.equal(1);
		expect(value(niceStep(Number.NaN))).to.equal(1);
	});
});

void describe('computeXDomain', () => {
	void it('rounds the data outwards to about ten nice ticks', () => {
		const cases: [number, number, number, number, number][] = [
			[0.3, 89, 0, 90, 10],
			[1.5, 29, 0, 30, 5],
			[96.8, 103.4, 96, 104, 1],
			[0.001, 0.049, 0, 0.05, 0.005],
			[-1450, 1480, -1500, 1500, 500],
		];
		for (const [dataMin, dataMax, min, max, tick] of cases) {
			const domain = computeXDomain(dataMin, dataMax, open);
			expect([domain.min, domain.max, value(domain.tickStep)]).to.deep.equal([min, max, tick]);
		}
	});

	void it('keeps the given ends as they are', () => {
		const domain = computeXDomain(5, 25, { min: 0, max: 30 });
		expect([domain.min, domain.max, value(domain.tickStep)]).to.deep.equal([0, 30, 5]);
	});

	void it('rounds an open end and keeps the given one', () => {
		const domain = computeXDomain(0.4, 87, { min: 0.25, max: null });
		expect(domain.min).to.equal(0.25);
		expect(domain.max).to.equal(90);
	});

	void it('gives an open end room when the data lies beyond the given one', () => {
		const domain = computeXDomain(1, 5, { min: 10, max: null });
		expect(domain.min).to.equal(10);
		expect(domain.max).to.be.greaterThan(10);
	});

	void it('swaps given ends in the wrong order', () => {
		const domain = computeXDomain(null, null, { min: 30, max: 0 });
		expect([domain.min, domain.max]).to.deep.equal([0, 30]);
	});

	void it('widens a single value and an empty given range around it', () => {
		const single = computeXDomain(5, 5, open);
		expect(single.min).to.be.lessThan(5);
		expect(single.max).to.be.greaterThan(5);
		const empty = computeXDomain(null, null, { min: 7, max: 7 });
		expect(empty.min).to.be.lessThan(7);
		expect(empty.max).to.be.greaterThan(7);
		const zero = computeXDomain(0, 0, open);
		expect(zero.min).to.be.lessThan(0);
		expect(zero.max).to.be.greaterThan(0);
	});

	void it('spans 0 to 10 without data or range', () => {
		const domain = computeXDomain(null, null, open);
		expect([domain.min, domain.max]).to.deep.equal([0, 10]);
	});

	void it('ignores range ends which are not numbers', () => {
		const domain = computeXDomain(0.3, 89, { min: Number.NaN, max: Number.POSITIVE_INFINITY });
		expect([domain.min, domain.max]).to.deep.equal([0, 90]);
	});
});

void describe('slot grid', () => {
	void it('uses a tenth of the tick step, a twentieth for a tick step of 2', () => {
		expect(value(slotStepFor(niceStep(10)))).to.equal(1);
		expect(value(slotStepFor(niceStep(5)))).to.equal(0.5);
		expect(value(slotStepFor(niceStep(2)))).to.equal(0.1);
		expect(value(slotStepFor(niceStep(0.005)))).to.equal(0.0005);
	});

	void it('covers the domain from its first to its last slot', () => {
		const grid = buildSlotGrid(computeXDomain(0.3, 89, open));
		expect(grid.count).to.equal(91);
		expect(slotValue(grid, 0)).to.equal(0);
		expect(slotValue(grid, grid.count - 1)).to.equal(90);
	});

	void it('snaps given ends outwards to the slot step', () => {
		const grid = buildSlotGrid(computeXDomain(null, null, { min: 0.33, max: 9.71 }));
		expect(slotValue(grid, 0)).to.be.at.most(0.33);
		expect(slotValue(grid, grid.count - 1)).to.be.at.least(9.71);
		expect(slotValue(grid, 0)).to.equal(0.3);
		expect(slotValue(grid, grid.count - 1)).to.equal(9.8);
	});

	void it('writes slot values without floating point drift', () => {
		const grid = buildSlotGrid(computeXDomain(0, 0.95, { min: 0, max: 1 }));
		expect(value(grid.step)).to.equal(0.01);
		for (let slot = 0; slot < grid.count; slot++) {
			expect(slotValue(grid, slot)).to.equal(Number((slot / 100).toFixed(2)));
		}
		const tiny = buildSlotGrid(computeXDomain(0.0000001, 0.0000049, open));
		expect(slotValue(tiny, 3)).to.equal(Number((3 * value(tiny.step)).toFixed(tiny.decimals)));
		expect(String(slotValue(tiny, 7))).to.not.match(/0000000|9999999/);
	});

	void it('works with negative domains', () => {
		const grid = buildSlotGrid(computeXDomain(-1450, 1480, open));
		expect(slotValue(grid, 0)).to.equal(-1500);
		expect(slotValue(grid, grid.count - 1)).to.equal(1500);
		expect(slotIndexOf(grid, 0)).to.equal(30);
	});

	void it('finds the slot nearest to a value, or none outside the grid', () => {
		const grid = buildSlotGrid(computeXDomain(0.3, 89, open));
		expect(slotIndexOf(grid, 0)).to.equal(0);
		expect(slotIndexOf(grid, 0.3 * 3)).to.equal(1);
		expect(slotIndexOf(grid, 89.6)).to.equal(90);
		expect(slotIndexOf(grid, -1)).to.equal(-1);
		expect(slotIndexOf(grid, 91)).to.equal(-1);
	});

	void it('never builds more than the maximum number of slots', () => {
		const grid = buildSlotGrid({ min: 0, max: 1e6, tickStep: niceStep(1) });
		expect(grid.count).to.be.at.most(MAX_SLOT_COUNT);
		expect(slotValue(grid, grid.count - 1)).to.be.at.least(1e6);
	});
});

void describe('large X magnitudes', () => {
	/** A grid of `min`…`max`, checked as the chart needs it: strictly increasing slots, each found back and weighed. */
	const checkedGrid = (min: number, max: number, range: ScatterRange = open): SlotGrid => {
		const grid = buildSlotGrid(computeXDomain(min, max, range));
		expect(Number.isFinite(grid.count)).to.equal(true);
		expect(grid.count).to.be.within(2, MAX_SLOT_COUNT);
		const levels = tickLevels(grid, grid.tickStep);
		let previous = Number.NEGATIVE_INFINITY;
		for (let slot = 0; slot < grid.count; slot++) {
			const x = slotValue(grid, slot);
			expect(x, `slot ${slot} of ${min}…${max}`).to.be.greaterThan(previous);
			expect(slotIndexOf(grid, x)).to.equal(slot);
			expect(tickWeight(grid, levels, x), `weight of slot ${slot} (${x})`).to.be.greaterThan(0);
			previous = x;
		}
		// The data stays inside the grid.
		expect(slotValue(grid, 0)).to.be.at.most(min);
		expect(slotValue(grid, grid.count - 1)).to.be.at.least(max);
		return grid;
	};

	void it('weighs every slot next to a large offset', () => {
		checkedGrid(1e10 + 0.001, 1e10 + 0.009);
		checkedGrid(1.7e12, 1.7e12 + 0.02);
	});

	void it('labels epoch milliseconds over hours and days at the usual steps', () => {
		const hour = checkedGrid(1.7e12, 1.7e12 + 3.6e6);
		expect(value(hour.tickStep)).to.equal(5e5);
		const week = checkedGrid(1.7e12, 1.7e12 + 7 * 864e5);
		expect(value(week.tickStep)).to.equal(1e8);
	});

	void it('coarsens a slot step below the precision of the values rather than repeat slot values', () => {
		checkedGrid(1e17, 1e17 + 1000);
		checkedGrid(-1e17 - 1000, -1e17);
		// Beyond the exact integers, a whole step is coarsened too.
		const huge = checkedGrid(1e17, 1e17 + 1);
		expect(value(huge.step)).to.be.greaterThan(1);
	});

	/** The share of the grid `min`…`max` spans. */
	const fill = (grid: SlotGrid, min: number, max: number): number => (max - min) / (slotValue(grid, grid.count - 1) - slotValue(grid, 0));

	void it('keeps the data across the plot next to a large offset, no coarser than the precision needs', () => {
		// Whole slots are exact up to 2^53: one apart at 1e15.
		const integers = checkedGrid(1e15, 1e15 + 1);
		expect([slotValue(integers, 0), slotValue(integers, integers.count - 1)]).to.deep.equal([1e15, 1e15 + 1]);
		// Epoch milliseconds to a hundredth.
		const epoch = checkedGrid(1.7e12, 1.7e12 + 0.02);
		expect(fill(epoch, 1.7e12, 1.7e12 + 0.02)).to.be.at.least(0.8);
		expect(fill(checkedGrid(1e17, 1e17 + 1000), 1e17, 1e17 + 1000)).to.be.at.least(0.8);
	});

	void it('widens a given range next to a large offset by less than a slot at either end', () => {
		for (const [min, max] of [[1e15, 1e15 + 1], [1.7e12, 1.7e12 + 0.02], [1.7e12 + 0.003, 1.7e12 + 0.017], [-1e17 - 1000, -1e17]]) {
			const grid = checkedGrid(min, max, { min, max });
			const step = value(grid.step);
			const what = `${min}…${max}: ${slotValue(grid, 0)}…${slotValue(grid, grid.count - 1)}`;
			expect(min - slotValue(grid, 0), what).to.be.below(step);
			expect(slotValue(grid, grid.count - 1) - max, what).to.be.below(step);
		}
	});

	void it('lays out every magnitude and span the numbers can tell apart', () => {
		for (let exponent = -83; exponent <= 299; exponent += 7) {
			for (const relative of [1e-13, 1e-9, 1e-4, 1]) {
				const min = Number(`1.234e${exponent}`);
				const max = min + min * relative;
				for (const [lo, hi] of [[min, max], [-max, -min]]) {
					// Given, so that the ends are exactly those of the data.
					const grid = checkedGrid(lo, hi, { min: lo, max: hi });
					const what = `${lo}…${hi}`;
					expect(lo - slotValue(grid, 0), what).to.be.below(value(grid.step));
					expect(slotValue(grid, grid.count - 1) - hi, what).to.be.below(value(grid.step));
					expect(fill(grid, lo, hi), what).to.be.at.least(relative > 1e-13 ? 0.5 : 0.1);
				}
			}
		}
	});

	void it('widens a span too narrow for the axis, with distinct slots', () => {
		for (const [min, max] of [[1e-300, 2e-300], [1e-110, 5e-110], [-3e-200, 3e-200]]) {
			for (const range of [open, { min, max }]) {
				const domain = computeXDomain(range === open ? min : null, range === open ? max : null, range);
				expect(domain.widened, `${min}…${max}`).to.equal(true);
				const grid = buildSlotGrid(domain);
				expect(grid.count).to.be.within(2, MAX_SLOT_COUNT);
				for (let slot = 1; slot < grid.count; slot++) {
					expect(slotValue(grid, slot), `slot ${slot} of ${min}…${max}`).to.be.greaterThan(slotValue(grid, slot - 1));
				}
			}
		}
		expect(computeXDomain(0, 1e-90, open).widened).to.equal(undefined);
	});

	void it('lays out the widest domain the axis takes without overflowing', () => {
		const widest = checkedGrid(-MAX_X_MAGNITUDE, MAX_X_MAGNITUDE);
		expect(slotValue(widest, 0)).to.equal(-MAX_X_MAGNITUDE);
		expect(slotValue(widest, widest.count - 1)).to.equal(MAX_X_MAGNITUDE);
		// A given range beyond it is brought back to it.
		const clamped = computeXDomain(null, null, { min: -1e308, max: 1e308 });
		expect([clamped.min, clamped.max]).to.deep.equal([-MAX_X_MAGNITUDE, MAX_X_MAGNITUDE]);
	});

	void it('ends the label chain at the largest number instead of looping', () => {
		// A domain near the largest number: the chain of steps overflows.
		const grid = buildSlotGrid(computeXDomain(1e307, 9e307, open));
		const started = Date.now();
		const levels = tickLevels(grid, grid.tickStep);
		expect(Date.now() - started).to.be.below(1000);
		expect(levels.length).to.be.greaterThan(0);
		expect(labelStepCandidates(grid).length).to.be.greaterThan(0);
	});

	void it('takes only finite X values within the largest magnitude', () => {
		expect([1e300, -1e300, 1.7e12, 0].every(isDrawableX)).to.equal(true);
		expect([1e301, -1e308, Number.NaN, Number.POSITIVE_INFINITY].some(isDrawableX)).to.equal(false);
	});
});

void describe('tick weights', () => {
	void it('chains through 5 below the label step and through 2 above it', () => {
		const steps = (labelStep: number): number[] => {
			const grid = buildSlotGrid(computeXDomain(0, 1000, { min: 0, max: 1000 }));
			return tickLevels(grid, niceStep(labelStep))
				.map((level: TickLevel) => Number((level.ratio * value(grid.step)).toPrecision(6)))
				.filter((step: number) => step <= 2000);
		};
		// The grid of 0–1000 has a slot step of 10.
		expect(steps(10)).to.deep.equal([10, 20, 100, 200, 1000, 2000]);
		expect(steps(20)).to.deep.equal([10, 20, 100, 200, 1000, 2000]);
		expect(steps(50)).to.deep.equal([10, 50, 100, 200, 1000, 2000]);
		expect(steps(100)).to.deep.equal([10, 50, 100, 200, 1000, 2000]);
		expect(steps(200)).to.deep.equal([10, 50, 100, 200, 1000, 2000]);
		expect(steps(500)).to.deep.equal([10, 50, 100, 500, 1000, 2000]);
	});

	void it('nests every step in the next one, from the slot step up', () => {
		for (const [dataMin, dataMax] of [[0.3, 89], [96.3, 103.7], [0.001, 0.049], [-1450, 1480], [0, 1e6], [-0.33, 0.71]]) {
			const grid = buildSlotGrid(computeXDomain(dataMin, dataMax, open));
			for (const labelStep of labelStepCandidates(grid)) {
				const levels = tickLevels(grid, labelStep);
				expect(levels[0].ratio).to.equal(1);
				expect(levels.some((level: TickLevel) => level.ratio === stepRatio(grid, labelStep))).to.equal(true);
				for (let i = 1; i < levels.length; i++) {
					expect(levels[i].ratio % levels[i - 1].ratio).to.equal(0);
					expect(levels[i].weight).to.be.greaterThan(levels[i - 1].weight);
				}
				expect(levels[levels.length - 1].ratio).to.be.at.least(grid.count - 1);
			}
		}
	});

	void it('offers every nice step from the tick step to the length of the axis', () => {
		const grid = buildSlotGrid(computeXDomain(0.3, 89, open));
		expect(labelStepCandidates(grid).map(value)).to.deep.equal([10, 20, 50, 100]);
		const years = buildSlotGrid(computeXDomain(null, null, { min: 0, max: 30 }));
		expect(labelStepCandidates(years).map(value)).to.deep.equal([5, 10, 20, 50]);
	});

	void it('makes zero the heaviest slot', () => {
		const grid = buildSlotGrid(computeXDomain(-1450, 1480, open));
		const levels = tickStepLevels(grid);
		expect(tickWeight(grid, levels, 0)).to.equal(ZERO_TICK_WEIGHT);
		for (let slot = 0; slot < grid.count; slot++) {
			const x = slotValue(grid, slot);
			if (x !== 0) {
				expect(tickWeight(grid, levels, x)).to.be.lessThan(ZERO_TICK_WEIGHT);
			}
		}
	});

	void it('weighs rounder values heavier', () => {
		const grid = buildSlotGrid(computeXDomain(0.3, 89, open));
		const levels = tickStepLevels(grid);
		expect(tickWeight(grid, levels, 20)).to.be.greaterThan(tickWeight(grid, levels, 10));
		expect(tickWeight(grid, levels, 10)).to.be.greaterThan(tickWeight(grid, levels, 5));
		expect(tickWeight(grid, levels, 5)).to.be.greaterThan(tickWeight(grid, levels, 3));
		expect(tickWeight(grid, levels, 30)).to.equal(tickWeight(grid, levels, 10));
	});

	void it('gives values off the grid no weight', () => {
		const grid = buildSlotGrid(computeXDomain(0.3, 89, open));
		expect(tickWeight(grid, tickStepLevels(grid), 0.5)).to.equal(0);
	});

	void it('gives values between slots no weight far from zero too: the tolerance is relative, and below a slot', () => {
		const unit: NiceStep = { mantissa: 1, exponent: 0 };
		// Each value is an exact number, off the slot `first + 1` by `off`. A
		// tolerance of |index| × 2⁻⁴⁶ took in half a slot at 2⁴⁶, and 2⁻⁶ of
		// one at 2⁴⁰.
		for (const [first, off] of [[2 ** 46, -0.5], [2 ** 40, 2 ** -7]]) {
			const grid: SlotGrid = { step: unit, first, count: 3, decimals: 0, tickStep: unit };
			const levels = tickStepLevels(grid);
			expect(tickWeight(grid, levels, first + 1), `the slot after ${first}`).to.be.greaterThan(0);
			expect(first + 1 + off - (first + 1), 'an exact number').to.equal(off);
			expect(tickWeight(grid, levels, first + 1 + off), `${off} of a slot off ${first + 1}`).to.equal(0);
		}
	});

	void it('picks evenly spaced labels at every label distance', () => {
		const domains: [number, number][] = [[0.3, 89], [1, 29], [96.3, 103.7], [0.001, 0.049], [-1450, 1480], [2, 7.9]];
		for (const [dataMin, dataMax] of domains) {
			const grid = buildSlotGrid(computeXDomain(dataMin, dataMax, open));
			for (const labelStep of labelStepCandidates(grid)) {
				const levels = tickLevels(grid, labelStep);
				for (let distance = 1; distance <= grid.count; distance++) {
					const labels = pickLabels(grid, levels, distance);
					expect(isEvenlySpaced(labels), `${dataMin}–${dataMax} at ${distance}: ${labels.join(' ')}`).to.equal(true);
				}
			}
		}
	});

	void it('compares label chains', () => {
		const grid = buildSlotGrid(computeXDomain(0.3, 89, open));
		expect(sameLevels(tickLevels(grid, niceStep(10)), tickLevels(grid, niceStep(10)))).to.equal(true);
		// 1-5-10-20-100 either way: the slots need not be weighed again.
		expect(sameLevels(tickLevels(grid, niceStep(10)), tickLevels(grid, niceStep(5)))).to.equal(true);
		// 1-2-10 against 1-5-10.
		expect(sameLevels(tickLevels(grid, niceStep(10)), tickLevels(grid, niceStep(2)))).to.equal(false);
	});

	void it('falls back to a 1-2-10 chain without a grid', () => {
		expect(fallbackTickWeight(0)).to.equal(ZERO_TICK_WEIGHT);
		expect(fallbackTickWeight(100)).to.be.greaterThan(fallbackTickWeight(20));
		expect(fallbackTickWeight(20)).to.be.greaterThan(fallbackTickWeight(10));
		expect(fallbackTickWeight(10)).to.be.greaterThan(fallbackTickWeight(2));
		expect(fallbackTickWeight(0.2)).to.be.greaterThan(fallbackTickWeight(0.1));
	});
});

/*
 Label widths of the chart's default 12 px font as headless Chrome measures
 it, so that the tests see the label densities the chart does.
 */
const CHARACTER_WIDTHS: Record<string, number> = {
	'.': 2.6,
	',': 2.6,
	'-': 6,
	' ': 3,
	K: 8,
	Y: 7.5,
	'%': 10,
};
const DIGIT_WIDTH = 7.6;
const FONT_SIZE = 12;
const GAP = FONT_SIZE * 0.5;
const PITCH = FONT_SIZE * 3;
const SPACING = { gap: GAP, minPitch: PITCH };

function textWidth(text: string): number {
	let width = 0;
	for (const character of text) {
		width += CHARACTER_WIDTHS[character] ?? DIGIT_WIDTH;
	}
	return width;
}

type Formatter = (x: number) => string;

const thousands: Formatter = (x: number) =>
	`${(x / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`;

interface LabelCase {
	name: string;
	grid: SlotGrid;
	format: Formatter;
}

function labelCase(name: string, dataMin: number | null, dataMax: number | null, range: ScatterRange = open, format?: Formatter): LabelCase {
	const grid = buildSlotGrid(computeXDomain(dataMin, dataMax, range));
	return { name, grid, format: format ?? ((x: number) => formatXValue(x, stepDecimals(grid.step))) };
}

const labelCases: LabelCase[] = [
	labelCase('−0.4…0.8', -0.33, 0.71),
	labelCase('−1M…1.5M in K', -830000, 1210000, open, thousands),
	labelCase('0…1e6', 0, 1e6),
	labelCase('0–90', 0.3, 89),
	labelCase('0–30Y', null, null, { min: 0, max: 30 }, (x: number) => `${x}Y`),
	labelCase('96–104', null, null, { min: 96, max: 104 }),
	labelCase('0–0.05', 0.001, 0.049),
	labelCase('−1500–1500', -1450, 1480),
	labelCase('0–45 %', 0, 45, open, (x: number) => `${x.toFixed(2)}%`),
];

/** Plot widths: charts of 300, 360, 420, 600 and 1400 px less a price scale, and the chart widths themselves. */
const plotWidths = [240, 300, 360, 420, 540, 600, 1340, 1400];

/** Where each label of `slots` is drawn: centred, moved back inside the axis when it overflows an end. */
function labelBoxes(c: LabelCase, slots: readonly number[], spacing: number, width: number): [number, number][] {
	return slots.map((slot: number) => {
		const size = textWidth(c.format(slotValue(c.grid, slot)));
		const left = Math.min(Math.max(0, slot * spacing - size / 2), width - size);
		return [left, left + size];
	});
}

function overlaps(boxes: readonly [number, number][], gap: number): boolean {
	return boxes.some((box: [number, number], i: number) => i > 0 && box[0] - boxes[i - 1][1] < gap - 1e-9);
}

/** Whether the labels of `slots` are far enough apart: no overlap, and the least pitch between centres. */
function fits(c: LabelCase, slots: readonly number[], spacing: number, width: number): boolean {
	const pitchOk = slots.every((slot: number, i: number) => i === 0 || (slot - slots[i - 1]) * spacing >= PITCH - 1e-9);
	return pitchOk && !overlaps(labelBoxes(c, slots, spacing, width), GAP);
}

/** The multiples of `step` on the grid, as slot indices. */
function multiples(grid: SlotGrid, step: NiceStep): number[] {
	const ratio = stepRatio(grid, step);
	const slots: number[] = [];
	for (let slot = 0; slot < grid.count; slot++) {
		if ((grid.first + slot) % ratio === 0) {
			slots.push(slot);
		}
	}
	return slots;
}

function choose(c: LabelCase, width: number): { labels: XAxisLabels; spacing: number } {
	const spacing = (width - 1) / (c.grid.count - 1);
	const labels = chooseXLabels(
		c.grid,
		{ spacing, origin: 0, width },
		(slot: number) => textWidth(c.format(slotValue(c.grid, slot))),
		SPACING
	);
	return { labels, spacing };
}

/** The slots the chart labels with `labels`, the distance passed as it converts it: in characters, then pixels. */
function chartSlots(c: LabelCase, labels: XAxisLabels, spacing: number): number[] {
	const pixelsPerCharacter = ((FONT_SIZE + 4) * 5) / 8;
	const minDistance = pixelsPerCharacter * (labels.minDistance / pixelsPerCharacter);
	return pickSlots(c.grid, labels.levels, Math.ceil(minDistance / spacing), labels.ends);
}

/** The slots the chart should label: the multiples of the step, or the two ends. */
function expectedSlots(c: LabelCase, labels: XAxisLabels): number[] {
	return labels.ends ? [0, c.grid.count - 1] : multiples(c.grid, labels.step);
}

void describe('chooseXLabels', () => {
	void it('has the chart place the labels of the chosen step and nothing finer', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				const { labels, spacing } = choose(c, width);
				const placed = chartSlots(c, labels, spacing);
				expect(placed, `${c.name} at ${width}px`).to.deep.equal(expectedSlots(c, labels));
			}
		}
	});

	void it('never lets labels overlap or crowd, the ones moved inside at the ends included', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				const { labels, spacing } = choose(c, width);
				const placed = chartSlots(c, labels, spacing);
				const what = `${c.name} at ${width}px: ${placed.map(s => c.format(slotValue(c.grid, s))).join(' ')}`;
				expect(fits(c, placed, spacing, width), what).to.equal(true);
			}
		}
	});

	void it('spaces the labels evenly', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				const { labels, spacing } = choose(c, width);
				const values = chartSlots(c, labels, spacing).map((slot: number) => slotValue(c.grid, slot));
				expect(isEvenlySpaced(values), `${c.name} at ${width}px: ${values.join(' ')}`).to.equal(true);
			}
		}
	});

	void it('shows two labels or more whenever a nice step allows it, and the finest such step', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				const { labels, spacing } = choose(c, width);
				// Every nice step whose labels would fit, found by brute force.
				const fitting = labelStepCandidates(c.grid).filter((step: NiceStep) => {
					const slots = multiples(c.grid, step);
					return slots.length >= 2 && fits(c, slots, spacing, width);
				});
				const placed = chartSlots(c, labels, spacing);
				const what = `${c.name} at ${width}px: ${placed.map(s => c.format(slotValue(c.grid, s))).join(' ')}`;
				if (fitting.length > 0) {
					expect(placed.length, what).to.be.at.least(2);
					expect(value(labels.step), what).to.equal(value(fitting[0]));
					expect(labels.ends, what).to.equal(false);
				} else if (fits(c, [0, c.grid.count - 1], spacing, width)) {
					// No nice step fits two labels, the two ends do.
					expect(placed, what).to.deep.equal([0, c.grid.count - 1]);
				}
			}
		}
	});

	void it('labels the narrowest charts of the design with two labels or more', () => {
		// Charts of 300 and 360 px; a price scale of about 60 px leaves 240–300 px.
		for (const c of labelCases) {
			for (const width of [240, 300]) {
				const { labels, spacing } = choose(c, width);
				const placed = chartSlots(c, labels, spacing);
				expect(placed.length, `${c.name} at ${width}px`).to.be.at.least(2);
			}
		}
	});

	void it('picks the labels of the design', () => {
		const at = (c: LabelCase, width: number): string[] => {
			const { labels, spacing } = choose(c, width);
			return chartSlots(c, labels, spacing).map((slot: number) => c.format(slotValue(c.grid, slot)));
		};
		const [small, pnl, million, ninety, years, rotation] = labelCases;
		// A 300 px chart with a narrow price scale (a 252 px plot): the labels
		// thin out to a coarser nice step, the ends pushed inside included.
		expect(at(small, 252)).to.deep.equal(['-0.4', '-0.2', '0', '0.2', '0.4', '0.6', '0.8']);
		expect(at(small, 240)).to.deep.equal(['0', '0.5']);
		expect(at(pnl, 252)).to.deep.equal(['-1,000.00 K', '0.00 K', '1,000.00 K']);
		expect(at(million, 252)).to.deep.equal(['0', '500000', '1000000']);
		expect(at(ninety, 252)).to.deep.equal(['0', '20', '40', '60', '80']);
		// With a price scale as wide as the labels (a 220 px plot), no nice step
		// fits two of these ("-1,000.00 K" pushed inside the left end would
		// touch "0.00 K"): the two ends of the axis are labelled instead.
		expect(at(pnl, 220)).to.deep.equal(['-1,000.00 K', '1,500.00 K']);
		// Wider, the nice steps come back.
		expect(at(pnl, 300)).to.deep.equal(['-1,000.00 K', '0.00 K', '1,000.00 K']);
		// Wide charts label every tick of the domain, and no finer.
		const tens = Array.from({ length: 10 }, (_: unknown, i: number) => String(i * 10));
		expect(at(ninety, 540)).to.deep.equal(tens);
		expect(at(ninety, 1340)).to.deep.equal(tens);
		expect(at(years, 1340)).to.deep.equal(['0Y', '5Y', '10Y', '15Y', '20Y', '25Y', '30Y']);
		expect(at(rotation, 540)).to.deep.equal(['96', '97', '98', '99', '100', '101', '102', '103', '104']);
	});

	void it('never labels finer than the tick step of the domain', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				expect(value(choose(c, width).labels.step), `${c.name} at ${width}px`).to.be.at.least(value(c.grid.tickStep));
			}
		}
	});

	void it('keeps a label on an axis too short for two, even at its ends', () => {
		const grid = buildSlotGrid(computeXDomain(null, null, { min: 0.45, max: 0.55 }));
		const labels = chooseXLabels(grid, { spacing: 0.5, origin: 0, width: 6 }, () => 30, SPACING);
		expect(labels.ends).to.equal(false);
		expect(multiples(grid, labels.step).length).to.equal(1);
	});

	void it('labels the two ends, and nothing else, when only they fit', () => {
		const grid = buildSlotGrid(computeXDomain(-830000, 1210000, open));
		const width = 220;
		const spacing = (width - 1) / (grid.count - 1);
		const labels = chooseXLabels(grid, { spacing, origin: 0, width }, (slot: number) => textWidth(thousands(slotValue(grid, slot))), SPACING);
		expect(labels.ends).to.equal(true);
		// Zero is heavier than the rest, yet left out: it is too close to both ends.
		const pixelsPerCharacter = ((FONT_SIZE + 4) * 5) / 8;
		const placed = pickSlots(grid, labels.levels, Math.ceil((pixelsPerCharacter * (labels.minDistance / pixelsPerCharacter)) / spacing), true);
		expect(placed).to.deep.equal([0, grid.count - 1]);
	});
});

void describe('chooseXLabels on a zoomed axis', () => {
	/** The plot of `width` zoomed `zoom` times into the fit, around the slot `centre`. */
	function zoomedGeometry(c: LabelCase, width: number, zoom: number, centre: number): XAxisGeometry {
		const spacing = ((width - 1) / (c.grid.count - 1)) * zoom;
		return { spacing, origin: width / 2 - centre * spacing, width, zoomed: true };
	}

	function chooseZoomed(c: LabelCase, geometry: XAxisGeometry): XAxisLabels {
		return chooseXLabels(c.grid, geometry, (slot: number) => textWidth(c.format(slotValue(c.grid, slot))), SPACING);
	}

	/** The slots the chart labels, and draws: those in view. */
	function slotsInView(c: LabelCase, labels: XAxisLabels, geometry: XAxisGeometry): number[] {
		const centre = (slot: number): number => geometry.origin + slot * geometry.spacing;
		return pickSlots(c.grid, labels.levels, Math.ceil(labels.minDistance / geometry.spacing), labels.ends)
			.filter((slot: number) => centre(slot) >= 0 && centre(slot) <= geometry.width);
	}

	/** Where the labels of `slots` are drawn: centred, the first and last of the grid moved back inside. */
	function zoomedBoxes(c: LabelCase, slots: readonly number[], geometry: XAxisGeometry): [number, number][] {
		return slots.map((slot: number, i: number) => {
			const size = textWidth(c.format(slotValue(c.grid, slot)));
			let left = geometry.origin + slot * geometry.spacing - size / 2;
			const ratio = i > 0 ? slot - slots[i - 1] : slots.length > 1 ? slots[1] - slot : c.grid.count;
			if (slot < ratio || slot >= c.grid.count - ratio) {
				left = Math.min(Math.max(0, left), geometry.width - size);
			}
			return [left, left + size];
		});
	}

	const zooms = [1.15, 1.4, 1.6, 2, 3, 5, 9];
	const centres = [0.2, 0.5, 0.8];

	void it('picks the labels of the fit at the fitted spacing', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				const fitted = choose(c, width).labels;
				const zoomed = chooseZoomed(c, { ...zoomedGeometry(c, width, 1, 0), origin: 0 });
				expect(value(zoomed.step), `${c.name} at ${width}px`).to.equal(value(fitted.step));
			}
		}
	});

	/** Whether the labels of `slots` fit side by side: no overlap, and the least pitch between centres. */
	function fitsInView(c: LabelCase, slots: readonly number[], geometry: XAxisGeometry): boolean {
		const pitchOk = slots.every((slot: number, i: number) => i === 0 || (slot - slots[i - 1]) * geometry.spacing >= PITCH - 1e-9);
		return pitchOk && !overlaps(zoomedBoxes(c, slots, geometry), GAP);
	}

	void it('keeps the labels in view apart and evenly spaced, two or more whenever a nice step allows it', () => {
		for (const c of labelCases) {
			for (const width of [240, 300, 600]) {
				for (const zoom of zooms) {
					for (const centre of centres) {
						const geometry = zoomedGeometry(c, width, zoom, centre * (c.grid.count - 1));
						const labels = chooseZoomed(c, geometry);
						const slots = slotsInView(c, labels, geometry);
						const what = `${c.name} at ${width}px, zoomed ${zoom}× around ${centre}: ` +
							slots.map((slot: number) => c.format(slotValue(c.grid, slot))).join(' ');
						expect(fitsInView(c, slots, geometry), what).to.equal(true);
						expect(isEvenlySpaced(slots.map((slot: number) => slotValue(c.grid, slot))), what).to.equal(true);
						// Every step no finer than the tick step of the domain whose labels in view would fit, by brute force.
						const centreOf = (slot: number): number => geometry.origin + slot * geometry.spacing;
						const fitting = labelStepCandidates(c.grid).filter((step: NiceStep) => {
							const inView = multiples(c.grid, step).filter((slot: number) => centreOf(slot) >= 0 && centreOf(slot) <= width);
							return inView.length >= 2 && fitsInView(c, inView, geometry);
						});
						if (fitting.length > 0) {
							expect(slots.length, what).to.be.at.least(2);
						}
					}
				}
			}
		}
	});

	void it('labels the zoomed PnL axis of a 300 px chart with two labels or more', () => {
		// The reviewer's case: "-1,000.00 K … 1,500.00 K" at 252 px, the fit
		// showing three labels; zoomed in, the fitted label distance left one.
		const pnl = labelCases[1];
		for (const spacing of [5.52, 6.68, 8.08, 8.89, 9.78, 12, 20]) {
			const geometry = { spacing, origin: 126 - 25 * spacing, width: 252, zoomed: true };
			const slots = slotsInView(pnl, chooseZoomed(pnl, geometry), geometry);
			expect(slots.length, `at a spacing of ${spacing}`).to.be.at.least(2);
		}
	});

	void it('counts only the labels in view', () => {
		// 0–90 zoomed 5× into its middle: the steps of 10 and 20 have a single
		// label or two in view; the labels are finer, about ten across the view.
		const ninety = labelCases[3];
		const geometry = zoomedGeometry(ninety, 540, 5, 45);
		const labels = chooseZoomed(ninety, geometry);
		expect(value(labels.step)).to.be.below(10);
		expect(labels.ends).to.equal(false);
	});

	void it('never has the chart move a label within reach of the fixed edge onto its neighbour', () => {
		// The second label of a zoomed axis overflowing the left edge: the chart
		// moves it inside when it is within round(distance / spacing) slots of
		// the first slot, onto the third one.
		const units = labelCase('0–100 units', 0, 100, open, (x: number) => `${x.toFixed(1)} units`);
		for (const c of [...labelCases, units]) {
			for (const width of [240, 300, 546, 600]) {
				for (const zoom of [1.6, 2, 2.4, 3, 4]) {
					const spacing = ((width - 1) / (c.grid.count - 1)) * zoom;
					for (let slot = 1; slot <= 12; slot++) {
						for (const into of [0.05, 0.2, 0.35, 0.48]) {
							// Slot `slot` `into` slots left of the left edge; the same at the right edge.
							for (const origin of [-(slot + into) * spacing, width + (slot + into) * spacing - (c.grid.count - 1) * spacing]) {
								const geometry = { spacing, origin, width, zoomed: true, movable: true };
								const labels = chooseZoomed(c, geometry);
								for (const distance of [labels.minDistance, labels.maxDistance]) {
									const boxes = drawnBoxes(c, labels, geometry, distance);
									const what = `${c.name} at ${width}px zoomed ${zoom}×, origin ${origin.toFixed(1)}, distance ${distance.toFixed(1)}: ` +
										boxes.map((box: [number, number]) => box.map((v: number) => v.toFixed(1)).join('…')).join(' ');
									expect(overlaps(boxes, 0), what).to.equal(false);
								}
							}
						}
					}
				}
			}
		}
	});
});

/**
 * Where the chart draws the labels with the distance `distance`, as
 * `TimeScale.marks()` and the time axis do: the slots in view and half a slot
 * beyond, each centred, but moved back inside an overflowing edge when within
 * `round(distance / spacing)` slots of that end of the grid (and the spacing at
 * most half the distance on an axis the user can move).
 */
function drawnBoxes(c: LabelCase, labels: XAxisLabels, geometry: XAxisGeometry, distance: number): [number, number][] {
	const { spacing, origin, width, movable = false } = geometry;
	const last = c.grid.count - 1;
	const perLabel = Math.round(distance / spacing);
	const aligning = !(movable && spacing > distance / 2);
	const boxes: [number, number][] = [];
	for (const slot of pickSlots(c.grid, labels.levels, Math.ceil(distance / spacing), labels.ends)) {
		const centre = origin + slot * spacing;
		if (centre < -spacing / 2 - 1 || centre > width + spacing / 2) {
			continue;
		}
		const size = textWidth(c.format(slotValue(c.grid, slot)));
		let left = centre - size / 2;
		if (aligning && (slot <= perLabel || slot >= last - perLabel)) {
			left = left < 0 ? 0 : left + size > width ? width - size : left;
		}
		boxes.push([left, left + size]);
	}
	return boxes;
}

void describe('label distance', () => {
	void it('draws the same labels at any distance from minDistance to maxDistance', () => {
		for (const c of labelCases) {
			for (const width of plotWidths) {
				const { labels, spacing } = choose(c, width);
				expect(labels.maxDistance, `${c.name} at ${width}px`).to.be.at.least(labels.minDistance);
				const geometry = { spacing, origin: 0, width };
				const at = (distance: number): string => JSON.stringify(drawnBoxes(c, labels, geometry, distance));
				const middle = (labels.minDistance + labels.maxDistance) / 2;
				expect(at(labels.maxDistance), `${c.name} at ${width}px`).to.equal(at(labels.minDistance));
				expect(at(middle), `${c.name} at ${width}px`).to.equal(at(labels.minDistance));
				for (const zoom of [1.4, 2, 3, 5]) {
					for (const centre of [0.2, 0.5, 0.8]) {
						const zoomed = { spacing: spacing * zoom, origin: width / 2 - centre * (c.grid.count - 1) * spacing * zoom, width, zoomed: true, movable: true };
						const zoomedLabels = chooseXLabels(c.grid, zoomed, (slot: number) => textWidth(c.format(slotValue(c.grid, slot))), SPACING);
						const atZoomed = (distance: number): string => JSON.stringify(drawnBoxes(c, zoomedLabels, zoomed, distance));
						const what = `${c.name} at ${width}px zoomed ${zoom}× around ${centre}`;
						expect(atZoomed(zoomedLabels.maxDistance), what).to.equal(atZoomed(zoomedLabels.minDistance));
					}
				}
			}
		}
	});
});

void describe('formatXValue', () => {
	void it('prints the decimals the step needs, without trailing zeros', () => {
		expect(formatXValue(10, 1)).to.equal('10');
		expect(formatXValue(0.25, 3)).to.equal('0.25');
		expect(formatXValue(0.1 + 0.2, 1)).to.equal('0.3');
		expect(formatXValue(-1500, 0)).to.equal('-1500');
		expect(formatXValue(-0.00001, 2)).to.equal('0');
	});
});
