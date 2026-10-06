import { expect } from 'chai';
import { describe, it } from 'node:test';

import type { ScatterPoint, ScatterSlotData } from '../../src/data.js';
import { ScatterModel, buildScatterModel, sameGrid } from '../../src/model.js';
import { ScatterSeriesOptions, defaultOptions } from '../../src/options.js';
import { mapSizeValue } from '../../src/size.js';
import { slotIndexOf, slotValue } from '../../src/x-axis.js';

type ScatterSlotItemLike = ScatterModel['slots'][number];

function build(points: ScatterPoint[], overrides: Partial<ScatterSeriesOptions> = {}): ScatterModel {
	return buildScatterModel(points, { ...defaultOptions, ...overrides });
}

function slotAt(model: ScatterModel, x: number): Partial<ScatterSlotData> {
	return model.slots[slotIndexOf(model.grid, x)] as Partial<ScatterSlotData>;
}

/** The slots carrying a value, as `[x, yMin, yMax]`. */
function filledSlots(model: ScatterModel): [number, number, number][] {
	return model.slots
		.filter(slot => (slot as Partial<ScatterSlotData>).yMin !== undefined)
		.map(slot => [slot.time, (slot as ScatterSlotData).yMin, (slot as ScatterSlotData).yMax]);
}

/** The price range the chart autoscales to: the extent of every slot value. */
function slotExtent(model: ScatterModel): [number, number] {
	const values = filledSlots(model).flatMap(([, low, high]) => [low, high]);
	return [Math.min(...values), Math.max(...values)];
}

void describe('buildScatterModel: slots', () => {
	void it('has one slot item per grid slot, at the slot values', () => {
		const model = build([{ x: 0.3, y: 1 }, { x: 89, y: 2 }]);
		expect(model.slots.length).to.equal(model.grid.count);
		model.slots.forEach((slot, index) => expect(slot.time).to.equal(slotValue(model.grid, index)));
	});

	void it('gives a slot the vertical extent of its points, and leaves empty slots as whitespace', () => {
		const model = build([
			{ x: 10, y: 5 },
			{ x: 10.2, y: -3 },
			{ x: 9.9, y: 8 },
			{ x: 40, y: 1 },
		], { xRange: { min: 0, max: 90 } });
		expect(slotAt(model, 10)).to.include({ yMin: -3, yMax: 8 });
		expect(slotAt(model, 40)).to.include({ yMin: 1, yMax: 1 });
		expect(slotAt(model, 20).yMin).to.equal(undefined);
	});

	void it('buckets points on a fractional step without drift', () => {
		const points = [0.1, 0.2, 0.3, 0.7].map((x: number) => ({ x: x * 3, y: x }));
		const model = build(points, { xRange: { min: 0, max: 3 } });
		expect(model.grid.step).to.deep.equal({ mantissa: 5, exponent: -2 });
		const filled = model.slots.filter(slot => (slot as Partial<ScatterSlotData>).yMin !== undefined).map(slot => slot.time);
		// The ends of the axis always carry a value.
		expect(filled).to.deep.equal([0, 0.3, 0.6, 0.9, 2.1, 3]);
	});

	void it('leaves out and hides points outside an explicit X range', () => {
		const model = build([{ x: -5, y: 100 }, { x: 5, y: 1 }, { x: 15, y: -100 }], { xRange: { min: 0, max: 10 } });
		expect(model.resolved.map(point => point.visible)).to.deep.equal([false, true, false]);
		expect(model.drawOrder).to.deep.equal([1]);
		// The end slots carry the lowest visible Y, which the range holds already.
		expect(filledSlots(model)).to.deep.equal([[0, 1, 1], [5, 1, 1], [10, 1, 1]]);
	});

	void it('leaves hidden groups out of the slots and the drawing, but keeps them in the X domain', () => {
		const points = [
			{ x: 5, y: 1, group: 'shown' },
			{ x: 20, y: 3, group: 'shown' },
			{ x: 500, y: 1000, group: 'hidden' },
		];
		const groups = [{ id: 'shown' }, { id: 'hidden', visible: false }];
		const model = build(points, { groups });
		const shown = build(points, { groups: groups.map(group => ({ ...group, visible: true })) });
		// A legend switching a group off or on never moves the X axis.
		expect(model.domain).to.deep.equal(shown.domain);
		expect(model.domain.max).to.be.at.least(500);
		expect(model.drawOrder).to.deep.equal([0, 1]);
		expect(model.slots.some(slot => (slot as Partial<ScatterSlotData>).yMax === 1000)).to.equal(false);
		expect(slotExtent(model)).to.deep.equal([1, 3]);
	});

	void it('gives an empty end slot the lowest Y of the nearest slot holding points', () => {
		// The points sit in the first slots only, as with a pinned range wider than the data.
		const model = build([{ x: 1, y: 4 }, { x: 3, y: 9 }, { x: 2, y: 6 }], { xRange: { min: 0, max: 100 } });
		const first = model.slots[0] as Partial<ScatterSlotData>;
		const last = model.slots[model.slots.length - 1] as Partial<ScatterSlotData>;
		// The first slot takes x = 1, the last one x = 3.
		expect([first.yMin, first.yMax, last.yMin, last.yMax]).to.deep.equal([4, 4, 9, 9]);
		expect(model.hasVisiblePoints).to.equal(true);
	});

	void it('never widens the autoscale of any visible part of the axis', () => {
		// Low points on the left, high ones on the right: zoomed into the right,
		// the price scale must not reach down to the left ones.
		const points: ScatterPoint[] = [
			{ x: 10, y: -120 },
			{ x: 20, y: -50 },
			{ x: 60, y: 128 },
			{ x: 75, y: 300 },
			{ x: 85, y: 140 },
		];
		const model = build(points, { xRange: { min: 0, max: 100 } });
		const filled = (slot: ScatterSlotItemLike): slot is ScatterSlotData => (slot as Partial<ScatterSlotData>).yMin !== undefined;
		const count = model.slots.length;
		const holdsPoints = (slot: number): boolean => points.some(point => slotIndexOf(model.grid, point.x) === slot);
		// Every visible range the chart could autoscale: a contiguous run of slots.
		for (let from = 0; from < count; from++) {
			for (let to = from; to < count; to++) {
				const run = model.slots.slice(from, to + 1);
				const values = run.filter(filled).flatMap(slot => [slot.yMin, slot.yMax]);
				const pointValues = points.filter(point => {
					const slot = slotIndexOf(model.grid, point.x);
					return slot >= from && slot <= to;
				}).map(point => point.y);
				if (pointValues.length > 0) {
					expect([Math.min(...values), Math.max(...values)], `slots ${from}…${to}`).to.deep.equal([Math.min(...pointValues), Math.max(...pointValues)]);
				} else {
					// Only end slots: never below the nearest points.
					for (const value of values) {
						expect(value, `slots ${from}…${to}`).to.be.oneOf([-120, 140]);
					}
				}
			}
		}
		expect(holdsPoints(count - 1)).to.equal(false);
		expect((model.slots[count - 1] as ScatterSlotData).yMin).to.equal(140);
		expect((model.slots[0] as ScatterSlotData).yMin).to.equal(-120);
	});

	void it('autoscales a normal dataset exactly as without the end slots', () => {
		const points: ScatterPoint[] = [];
		for (let i = 0; i < 200; i++) {
			points.push({ x: 3 + ((i * 37) % 83) + (i % 7) / 10, y: Math.sin(i) * 1e6 + i * 1000 });
		}
		const model = build(points);
		const ys = points.map(point => point.y);
		expect(slotExtent(model)).to.deep.equal([Math.min(...ys), Math.max(...ys)]);
		// Every slot holding points carries their extent, unchanged.
		for (const [x, low, high] of filledSlots(model)) {
			const inSlot = points.filter(point => slotIndexOf(model.grid, point.x) === slotIndexOf(model.grid, x)).map(point => point.y);
			if (inSlot.length > 0) {
				expect([low, high]).to.deep.equal([Math.min(...inSlot), Math.max(...inSlot)]);
			}
		}
	});

	void it('scales an empty plot to the hidden points, the pinned range, the baselines, or zero', () => {
		const hidden = build([{ x: 1, y: -2, group: 'a' }, { x: 9, y: 5, group: 'a' }], { groups: [{ id: 'a', visible: false }] });
		expect(hidden.hasVisiblePoints).to.equal(false);
		expect(filledSlots(hidden)).to.deep.equal([[1, -2, 5], [9, -2, 5]]);
		const pinned = build([], { yRange: { min: 0, max: 12 }, baselines: [{ axis: 'y', value: 50 }] });
		expect(filledSlots(pinned)).to.deep.equal([[0, 0, 12], [10, 0, 12]]);
		const halfPinned = build([], { yRange: { min: null, max: 12 } });
		expect(filledSlots(halfPinned)).to.deep.equal([[0, 12, 12], [10, 12, 12]]);
		const baselines = build([], { baselines: [{ axis: 'y', value: 100 }, { axis: 'y', value: 96 }] });
		expect(filledSlots(baselines)).to.deep.equal([[0, 96, 100], [10, 96, 100]]);
		const empty = build([]);
		expect(filledSlots(empty)).to.deep.equal([[0, 0, 0], [10, 0, 0]]);
		expect([slotValue(empty.grid, 0), slotValue(empty.grid, empty.grid.count - 1)]).to.deep.equal([0, 10]);
	});

	void it('ignores points whose coordinates are not numbers', () => {
		const model = build([{ x: Number.NaN, y: 1 }, { x: 1, y: Number.POSITIVE_INFINITY }, { x: 2, y: 3 }]);
		expect(model.resolved.map(point => point.visible)).to.deep.equal([false, false, true]);
		expect(model.drawOrder).to.deep.equal([2]);
	});
});

void describe('buildScatterModel: points', () => {
	void it('draws points without a group first, then group by group, each in data order', () => {
		const model = build([
			{ x: 1, y: 1, group: 'b' },
			{ x: 2, y: 1, group: 'a' },
			{ x: 3, y: 1 },
			{ x: 4, y: 1, group: 'b' },
			{ x: 5, y: 1 },
		], { groups: [{ id: 'a' }, { id: 'b' }] });
		expect(model.drawOrder).to.deep.equal([2, 4, 1, 0, 3]);
		expect(model.groupMembers).to.deep.equal([[1], [0, 3]]);
	});

	void it('identifies a point by its id or its index; the first of a duplicate id wins', () => {
		const model = build([{ x: 1, y: 1, id: 'one' }, { x: 2, y: 1 }, { x: 3, y: 1, id: 'one' }]);
		expect(model.resolved.map(point => point.id)).to.deep.equal(['one', '1', 'one']);
		expect(model.idToIndex.get('one')).to.equal(0);
		expect(model.idToIndex.get('1')).to.equal(1);
		expect(model.duplicateIds).to.equal(true);
		expect(build([{ x: 1, y: 1, id: 'one' }, { x: 2, y: 1 }]).duplicateIds).to.equal(false);
	});

	void it('takes the size domain from every group, hidden ones included', () => {
		const points = [
			{ x: 1, y: 1, group: 'a', sizeValue: 0 },
			{ x: 2, y: 1, group: 'b', sizeValue: 10 },
			{ x: 3, y: 1, group: 'c', sizeValue: 20 },
		];
		const groups = [{ id: 'a' }, { id: 'b' }, { id: 'c', visible: false }];
		const model = build(points, { groups, sizeRange: { min: 10, max: 20 } });
		// Hiding `c` leaves the sizes of the others as they were.
		expect(model.resolved.map(point => point.size)).to.deep.equal([10, 15, 20]);
		const shown = build(points, { groups: groups.map(group => ({ ...group, visible: true })), sizeRange: { min: 10, max: 20 } });
		expect(shown.resolved.map(point => point.size)).to.deep.equal([10, 15, 20]);
		// The price scale room is for the visible points only.
		expect(model.maxSize).to.equal(15);
	});

	void it('counts the points of every group', () => {
		const model = build([
			{ x: 1, y: 1, group: 'b' },
			{ x: 2, y: Number.NaN, group: 'b' },
			{ x: 3, y: 1, group: 'c' },
			{ x: 4, y: 1 },
		], { groups: [{ id: 'a' }, { id: 'b' }] });
		expect(model.groups.map(group => group.id)).to.deep.equal(['a', 'b', 'c']);
		expect(model.groupPointCounts).to.deep.equal([0, 2, 1]);
	});

	void it('honours an explicit size domain', () => {
		const model = build([{ x: 1, y: 1, sizeValue: 5 }], { sizeDomain: { min: 0, max: 10 }, sizeRange: { min: 10, max: 20 } });
		expect(model.resolved[0].size).to.equal(15);
	});

	void it('keeps the horizontal baselines and widens the X domain to the vertical ones', () => {
		const model = build([{ x: 1, y: 1 }, { x: 9, y: 1 }], {
			baselines: [{ axis: 'y', value: 0 }, { axis: 'x', value: 50 }, { axis: 'y', value: Number.NaN }],
		});
		expect(model.yBaselines).to.deep.equal([{ axis: 'y', value: 0 }]);
		expect(model.domain.max).to.be.at.least(50);
	});
});

void describe('sameGrid', () => {
	void it('compares the slots and the tick step of two grids', () => {
		const a = build([{ x: 0.3, y: 1 }, { x: 89, y: 1 }]).grid;
		const b = build([{ x: 1, y: 2 }, { x: 88, y: 2 }]).grid;
		const c = build([{ x: 0.3, y: 1 }, { x: 150, y: 1 }]).grid;
		expect(sameGrid(a, b)).to.equal(true);
		expect(sameGrid(a, c)).to.equal(false);
		expect(sameGrid(null, a)).to.equal(false);
		expect(sameGrid(null, null)).to.equal(true);
	});
});

void describe('size mapping', () => {
	/** Every point sized by its value is drawn at the size the mapping gives its value. */
	function expectParity(model: ScatterModel): void {
		const scaling = model.sizeScaling;
		expect(scaling).to.not.equal(null);
		model.points.forEach((point: ScatterPoint, index: number) => {
			if (point.sizeValue !== undefined && Number.isFinite(point.sizeValue) && point.size === undefined) {
				expect(model.resolved[index].size).to.equal(mapSizeValue(point.sizeValue, scaling!));
			}
		});
	}

	void it('is null when no point is sized by its value', () => {
		expect(build([{ x: 1, y: 1 }]).sizeScaling).to.equal(null);
		expect(build([{ x: 1, y: 1, sizeValue: Number.NaN }]).sizeScaling).to.equal(null);
		// A point's own size beats its value, so the value maps nothing.
		expect(build([{ x: 1, y: 1, sizeValue: 4, size: 10 }]).sizeScaling).to.equal(null);
		expect(build([{ x: 1, y: 1 }], { sizeDomain: { min: 0, max: 10 } }).sizeScaling).to.equal(null);
	});

	void it('maps the values of every group, hidden ones included, as the points are drawn', () => {
		const points = [
			{ x: 1, y: 1, group: 'a', sizeValue: 2 },
			{ x: 2, y: 1, group: 'b', sizeValue: 7 },
			{ x: 3, y: 1, group: 'b', sizeValue: 12, size: 40 },
			{ x: 4, y: 1, group: 'c', sizeValue: 30 },
		];
		const model = build(points, { groups: [{ id: 'a' }, { id: 'b' }, { id: 'c', visible: false }], sizeScale: 'area' });
		expect(model.sizeScaling).to.deep.equal({ domain: { min: 2, max: 30 }, range: { min: 5, max: 25 }, scale: 'area' });
		expectParity(model);
	});

	void it('has the range within the size limits, and degenerate domains drawn alike', () => {
		const limited = build([{ x: 1, y: 1, sizeValue: 1 }, { x: 2, y: 1, sizeValue: 9 }], { pointSizeLimits: { min: 2, max: 3 } });
		expect(limited.sizeScaling?.range).to.deep.equal({ min: 3, max: 3 });
		expectParity(limited);
		const single = build([{ x: 1, y: 1, sizeValue: 4 }, { x: 2, y: 1, sizeValue: 4 }], { sizeRange: { min: 10, max: 20 } });
		expect(single.resolved.map(point => point.size)).to.deep.equal([15, 15]);
		expectParity(single);
		const reversed = build([{ x: 1, y: 1, sizeValue: 0 }, { x: 2, y: 1, sizeValue: 10 }], { sizeDomain: { min: 10, max: 0 } });
		expect(reversed.resolved.map(point => point.size)).to.deep.equal([25, 5]);
		expectParity(reversed);
	});
});

void describe('point size limits', () => {
	void it('bound every size and the room the price scale keeps', () => {
		const model = build([
			{ x: 1, y: 1 },
			{ x: 2, y: 1, size: 1 },
			{ x: 3, y: 1, sizeValue: 0 },
			{ x: 4, y: 1, sizeValue: 10 },
		], { pointSizeLimits: { min: 2, max: 3 }, sizeRange: { min: 1, max: 2.5 } });
		expect(model.resolved.map(point => point.size)).to.deep.equal([3, 2, 2, 2.5]);
		expect(model.maxSize).to.equal(3);
	});

	void it('keep the defaults of the design', () => {
		expect(defaultOptions.pointSizeLimits).to.deep.equal({ min: 5, max: 50 });
		const model = build([{ x: 1, y: 1, size: 2 }, { x: 2, y: 1, size: 80 }]);
		expect(model.resolved.map(point => point.size)).to.deep.equal([5, 50]);
	});
});
