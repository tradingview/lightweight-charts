import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ensure, ensureNotNull } from '../../src/helpers/assertions';
import { PlotRow, PlotValue } from '../../src/model/plot-data';
import { mergePlotRows, PlotInfoList, PlotList, PlotRowSearchMode } from '../../src/model/plot-list';
import { TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

type PlotValueTuple = [PlotValue, PlotValue, PlotValue];
type OHLCTuple = [PlotValue, PlotValue, PlotValue, PlotValue];
type PlotValueTuple5 = [PlotValue, PlotValue, PlotValue, PlotValue, PlotValue];

function row(i: TimePointIndex): PlotRow<UTCTimestamp, PlotValueTuple> {
	return { index: i, value: [i * 3, i * 3 + 1, i * 3 + 2] as PlotValueTuple, time: 0 as UTCTimestamp };
}

describe('PlotList', () => {
	const p = new PlotList<UTCTimestamp, PlotValueTuple>(new Map());

	beforeEach(() => {
		p.clear();
		p.add(-3 as TimePointIndex, 1 as UTCTimestamp, [1, 2, 3]);
		p.add(-3 as TimePointIndex, 2 as UTCTimestamp, [1, 2, 3]);
		p.add(0 as TimePointIndex, 3 as UTCTimestamp, [10, 20, 30]);
		p.add(3 as TimePointIndex, 4 as UTCTimestamp, [100, 200, 300]);
	});

	it('should contain all plot values that was previously added', () => {
		expect(p.size()).to.be.equal(3);
		expect(p.contains(-3 as TimePointIndex)).to.be.equal(true);
		expect(ensureNotNull(p.valueAt(-3 as TimePointIndex)).value).to.include.ordered.members([1, 2, 3]);
		expect(ensureNotNull(p.valueAt(-3 as TimePointIndex)).time).to.be.equal(2);
		expect(p.contains(0 as TimePointIndex)).to.be.equal(true);
		expect(ensureNotNull(p.valueAt(0 as TimePointIndex)).value).to.include.ordered.members([10, 20, 30]);
		expect(ensureNotNull(p.valueAt(0 as TimePointIndex)).time).to.be.equal(3);
		expect(p.contains(3 as TimePointIndex)).to.be.equal(true);
		expect(ensureNotNull(p.valueAt(3 as TimePointIndex)).value).to.include.ordered.members([100, 200, 300]);
		expect(ensureNotNull(p.valueAt(3 as TimePointIndex)).time).to.be.equal(4);
	});

	it('should not contain any extraneous plot values', () => {
		expect(p.contains(1 as TimePointIndex)).to.be.equal(false);
	});

	it('should preserve the order of plot values', () => {
		const items: PlotRow<UTCTimestamp, PlotValueTuple>[] = [];
		p.each((index: TimePointIndex, value: PlotRow<UTCTimestamp, PlotValueTuple>) => {
			items.push(value);
			return false;
		});

		expect(items.length).to.be.equal(3);
		expect(items[0].value).to.include.ordered.members([1, 2, 3]);
		expect(items[1].value).to.include.ordered.members([10, 20, 30]);
		expect(items[2].value).to.include.ordered.members([100, 200, 300]);
	});

	it('should remove all plot values after calling \'clear\'', () => {
		p.clear();

		expect(p.isEmpty()).to.be.equal(true);
		expect(p.size()).to.be.equal(0);
	});

	describe('merge', () => {
		it('should correctly insert new and update existing plot values', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			// first merge
			const earliestRow1 = plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);
			expect(earliestRow1).to.deep.include(row(0 as TimePointIndex));

			// second merge
			const earliestRow2 = plotList.merge([
				row(2 as TimePointIndex),
			]);
			expect(earliestRow2).to.deep.include(row(2 as TimePointIndex));

			// third merge
			const earliestRow3 = plotList.merge([
				row(-5 as TimePointIndex),
				row(0 as TimePointIndex),
				row(25 as TimePointIndex),
			]);
			expect(earliestRow3).to.deep.include(row(-5 as TimePointIndex));

			// final result
			const items: PlotRow<UTCTimestamp, PlotValueTuple>[] = [];
			plotList.each(
				(index: TimePointIndex, value: PlotRow<UTCTimestamp, PlotValueTuple>) => {
					items.push(value);
					return false;
				}
			);
			expect(items.length).to.be.equal(5);
			expect(items[0].value).to.include.ordered.members([-15, -14, -13]);
			expect(items[1].value).to.include.ordered.members([0, 1, 2]);
			expect(items[2].value).to.include.ordered.members([3, 4, 5]);
			expect(items[3].value).to.include.ordered.members([6, 7, 8]);
			expect(items[4].value).to.include.ordered.members([75, 76, 77]);
		});

		it('should correctly prepend new plot values', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);

			const earliestRow2 = plotList.merge([
				row(-2 as TimePointIndex),
				row(-1 as TimePointIndex),
			]);
			expect(earliestRow2).to.deep.include(row(-2 as TimePointIndex));

			expect(plotList.size()).to.be.equal(5);
			expect(ensureNotNull(plotList.valueAt(-2 as TimePointIndex)).value).to.include.ordered.members(row(-2 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(-1 as TimePointIndex)).value).to.include.ordered.members(row(-1 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(0 as TimePointIndex)).value).to.include.ordered.members(row(0 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(1 as TimePointIndex)).value).to.include.ordered.members(row(1 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(2 as TimePointIndex)).value).to.include.ordered.members(row(2 as TimePointIndex).value);
		});

		it('should correctly append new plot values', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);

			const earliestRow2 = plotList.merge([
				row(3 as TimePointIndex),
				row(4 as TimePointIndex),
			]);
			expect(earliestRow2).to.deep.include(row(3 as TimePointIndex));

			expect(plotList.size()).to.be.equal(5);
			expect(ensureNotNull(plotList.valueAt(0 as TimePointIndex)).value).to.include.ordered.members(row(0 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(1 as TimePointIndex)).value).to.include.ordered.members(row(1 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(2 as TimePointIndex)).value).to.include.ordered.members(row(2 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(3 as TimePointIndex)).value).to.include.ordered.members(row(3 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(4 as TimePointIndex)).value).to.include.ordered.members(row(4 as TimePointIndex).value);
		});
	});

	describe('remove', () => {
		const p1 = new PlotList<UTCTimestamp, PlotValueTuple>();

		beforeEach(() => {
			p1.clear();
			p1.add(-9 as TimePointIndex, 1 as UTCTimestamp, [1, 2, 3]);
			p1.add(-5 as TimePointIndex, 2 as UTCTimestamp, [4, 5, 6]);
			p1.add(0 as TimePointIndex, 3 as UTCTimestamp, [10, 20, 30]);
			p1.add(5 as TimePointIndex, 4 as UTCTimestamp, [40, 50, 60]);
			p1.add(9 as TimePointIndex, 5 as UTCTimestamp, [100, 200, 300]);
		});

		it('should remove all the plot rows starting from the specified index, if the index is inside the PlotList\'s range', () => {
			// first remove
			const earliestRow1 = p1.remove(9 as TimePointIndex);
			expect(earliestRow1).to.deep.include({ index: 9 as TimePointIndex, value: [100, 200, 300] });
			expect(p1.size()).to.be.equal(4);
			expect(p1.first()).to.deep.include({ index: -9 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.firstIndex()).to.be.equal(-9 as TimePointIndex);
			expect(p1.last()).to.deep.include({ index: 5 as TimePointIndex, value: [40, 50, 60] });
			expect(p1.lastIndex()).to.be.equal(5 as TimePointIndex);
			expect(ensureNotNull(p1.valueAt(-9 as TimePointIndex)).value).to.include.ordered.members([1, 2, 3]);
			expect(ensureNotNull(p1.valueAt(-5 as TimePointIndex)).value).to.include.ordered.members([4, 5, 6]);
			expect(ensureNotNull(p1.valueAt(0 as TimePointIndex)).value).to.include.ordered.members([10, 20, 30]);
			expect(ensureNotNull(p1.valueAt(5 as TimePointIndex)).value).to.include.ordered.members([40, 50, 60]);
			expect(p1.valueAt(9 as TimePointIndex)).to.be.equal(null);

			// second remove
			const earliestRow2 = p1.remove(-5 as TimePointIndex);
			expect(earliestRow2).to.deep.include({ index: -5 as TimePointIndex, value: [4, 5, 6] });
			expect(p1.size()).to.be.equal(1);
			expect(p1.first()).to.deep.include({ index: -9 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.firstIndex()).to.be.equal(-9 as TimePointIndex);
			expect(p1.last()).to.deep.include({ index: -9 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.lastIndex()).to.be.equal(-9 as TimePointIndex);
			expect(ensureNotNull(p1.valueAt(-9 as TimePointIndex)).value).to.include.ordered.members([1, 2, 3]);
			expect(p1.valueAt(-5 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(0 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(5 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(9 as TimePointIndex)).to.be.equal(null);

			// third remove
			const earliestRow3 = p1.remove(-9 as TimePointIndex);
			expect(earliestRow3).to.deep.include({ index: -9 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.size()).to.be.equal(0);
			expect(p1.first()).to.be.equal(null);
			expect(p1.firstIndex()).to.be.equal(null);
			expect(p1.last()).to.be.equal(null);
			expect(p1.lastIndex()).to.be.equal(null);
			expect(p1.valueAt(-9 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(-5 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(0 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(5 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(9 as TimePointIndex)).to.be.equal(null);
		});

		it('should be no-op if the specified index is greater than last index in PlotList', () => {
			const earliestRow = p1.remove(11 as TimePointIndex);
			expect(earliestRow).to.be.equal(null);
			expect(p1.size()).to.be.equal(5);
			expect(p1.first()).to.deep.include({ index: -9 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.firstIndex()).to.be.equal(-9 as TimePointIndex);
			expect(p1.last()).to.deep.include({ index: 9 as TimePointIndex, value: [100, 200, 300] });
			expect(p1.lastIndex()).to.be.equal(9 as TimePointIndex);
			expect(ensureNotNull(p1.valueAt(-9 as TimePointIndex)).value).to.include.ordered.members([1, 2, 3]);
			expect(ensureNotNull(p1.valueAt(-5 as TimePointIndex)).value).to.include.ordered.members([4, 5, 6]);
			expect(ensureNotNull(p1.valueAt(0 as TimePointIndex)).value).to.include.ordered.members([10, 20, 30]);
			expect(ensureNotNull(p1.valueAt(5 as TimePointIndex)).value).to.include.ordered.members([40, 50, 60]);
			expect(ensureNotNull(p1.valueAt(9 as TimePointIndex)).value).to.include.ordered.members([100, 200, 300]);
		});

		it('should remove all the plot rows if the specified index is less than first index in PlotList', () => {
			const earliestRow = p1.remove(-11 as TimePointIndex);
			expect(earliestRow).to.deep.include({ index: -9 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.size()).to.be.equal(0);
			expect(p1.first()).to.be.equal(null);
			expect(p1.firstIndex()).to.be.equal(null);
			expect(p1.last()).to.be.equal(null);
			expect(p1.lastIndex()).to.be.equal(null);
			expect(p1.valueAt(-9 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(-5 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(0 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(5 as TimePointIndex)).to.be.equal(null);
			expect(p1.valueAt(9 as TimePointIndex)).to.be.equal(null);
		});
	});

	describe('search', () => {
		const p1 = new PlotList<UTCTimestamp, PlotValueTuple>();

		beforeEach(() => {
			p1.clear();
			p1.add(-5 as TimePointIndex, 1 as UTCTimestamp, [1, 2, 3]);
			p1.add(0 as TimePointIndex, 2 as UTCTimestamp, [10, 20, 30]);
			p1.add(5 as TimePointIndex, 3 as UTCTimestamp, [100, 200, 300]);
		});

		it('should find respective values by given index and search strategy', () => {
			expect(p1.search(-10 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.deep.include({ index: -5 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.search(3 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(1 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(-6 as TimePointIndex, PlotRowSearchMode.Exact)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex)).to.deep.include({ index: -5 as TimePointIndex, value: [1, 2, 3] });
			expect(p1.search(0 as TimePointIndex)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(5 as TimePointIndex)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300] });
			expect(p1.search(6 as TimePointIndex)).to.be.equal(null);
			expect(p1.search(-3 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(3 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300] });
			expect(p1.search(5 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300] });
			expect(p1.search(6 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.be.equal(null);
		});
	});

	describe('search with skipping empty values', () => {
		const p1 = new PlotList<UTCTimestamp, PlotValueTuple>(null, (value: PlotValueTuple) => {
			return value[1] === undefined;
		});

		beforeEach(() => {
			p1.clear();
			p1.add(-5 as TimePointIndex, 1 as UTCTimestamp, [1, undefined, 3]);
			p1.add(0 as TimePointIndex, 2 as UTCTimestamp, [10, 20, 30]);
			p1.add(5 as TimePointIndex, 3 as UTCTimestamp, [100, undefined, 300]);
		});

		it('should not check for empty values if search strategy is "exact"', () => {
			expect(p1.search(-10 as TimePointIndex, PlotRowSearchMode.Exact, true)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex, PlotRowSearchMode.Exact, true)).to.deep.include({ index: -5 as TimePointIndex, value: [1, undefined, 3] });
			expect(p1.search(0 as TimePointIndex, PlotRowSearchMode.Exact, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(5 as TimePointIndex, PlotRowSearchMode.Exact, true)).to.deep.include({ index: 5 as TimePointIndex, value: [100, undefined, 300] });
			expect(p1.search(10 as TimePointIndex, PlotRowSearchMode.Exact, true)).to.be.equal(null);
		});

		it('should check for empty values if search strategy is "nearest left"', () => {
			expect(p1.search(-10 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.be.equal(null);
			expect(p1.search(-3 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.be.equal(null);
			expect(p1.search(0 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(3 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(5 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(8 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(10 as TimePointIndex, PlotRowSearchMode.NearestLeft, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
		});

		it('should check for empty values if search strategy is "nearest right"', () => {
			expect(p1.search(-10 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(-5 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(-3 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(0 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30] });
			expect(p1.search(3 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.be.equal(null);
			expect(p1.search(5 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.be.equal(null);
			expect(p1.search(8 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.be.equal(null);
			expect(p1.search(10 as TimePointIndex, PlotRowSearchMode.NearestRight, true)).to.be.equal(null);
		});
	});

	describe('minMaxOnRangeCached', () => {
		const pl = new PlotList<UTCTimestamp, PlotValueTuple5>(new Map([
			['plot0', (plotRow: PlotValueTuple5) => plotRow[0]],
			['plot1', (plotRow: PlotValueTuple5) => plotRow[1]],
			['plot2', (plotRow: PlotValueTuple5) => plotRow[2]],
			['plot3', (plotRow: PlotValueTuple5) => plotRow[3]],
			['plot4', (plotRow: PlotValueTuple5) => plotRow[4]],
		]));

		beforeEach(() => {
			pl.clear();
			pl.add(0 as TimePointIndex, 1 as UTCTimestamp, [null, undefined, NaN, 1, NaN]);
			pl.add(1 as TimePointIndex, 2 as UTCTimestamp, [null, undefined, NaN, 2, null]);
			pl.add(2 as TimePointIndex, 3 as UTCTimestamp, [null, undefined, NaN, 3, undefined]);
			pl.add(3 as TimePointIndex, 4 as UTCTimestamp, [null, undefined, NaN, 4, 123]);
			pl.add(4 as TimePointIndex, 5 as UTCTimestamp, [null, undefined, NaN, 5, 1]);
		});

		it('should return null if there is only null, undefined or NaN values', () => {
			const plots: PlotInfoList = [
				{
					name: 'plot0',
					offset: 0,
				},
				{
					name: 'plot1',
					offset: 0,
				},
				{
					name: 'plot2',
					offset: 0,
				},
			];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, plots);
			expect(minMax).to.be.equal(null);
		});

		it('should find minMax in numbers', () => {
			const plots: PlotInfoList = [
				{
					name: 'plot3',
					offset: 0,
				},
			];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(5);
		});

		it('should find minMax with non subsequent indices', () => {
			pl.clear();
			pl.add(0 as TimePointIndex, 1 as UTCTimestamp, [null, undefined, NaN, 1, NaN]);
			pl.add(2 as TimePointIndex, 2 as UTCTimestamp, [null, undefined, NaN, 2, null]);
			pl.add(4 as TimePointIndex, 3 as UTCTimestamp, [null, undefined, NaN, 3, undefined]);
			pl.add(6 as TimePointIndex, 4 as UTCTimestamp, [null, undefined, NaN, 4, 123]);
			pl.add(20 as TimePointIndex, 5 as UTCTimestamp, [null, undefined, NaN, 10, 123]);
			pl.add(100 as TimePointIndex, 6 as UTCTimestamp, [null, undefined, NaN, 5, 1]);

			const plots: PlotInfoList = [
				{
					name: 'plot3',
					offset: 0,
				},
			];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 100 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(10);
		});

		it('should skip null, undefined and NaN values', () => {
			const plots: PlotInfoList = [
				{
					name: 'plot4',
					offset: 0,
				},
			];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(123);
		});

		it('should return correct values if the data has gaps and we start search with second-to-last chunk', () => {
			pl.clear();
			pl.add(29 as TimePointIndex, 1 as UTCTimestamp, [1, 1, 1, 1, 0]);
			pl.add(31 as TimePointIndex, 2 as UTCTimestamp, [2, 2, 2, 2, 0]);
			pl.add(55 as TimePointIndex, 3 as UTCTimestamp, [3, 3, 3, 3, 0]);
			pl.add(65 as TimePointIndex, 4 as UTCTimestamp, [4, 4, 4, 4, 0]);

			const plots: PlotInfoList = [
				{
					name: 'plot1',
					offset: 0,
				},
			];

			const minMax = pl.minMaxOnRangeCached(30 as TimePointIndex, 200 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(2);
			expect(ensureNotNull(minMax).max).to.be.equal(4);

			const minMax2 = pl.minMaxOnRangeCached(30 as TimePointIndex, 60 as TimePointIndex, plots);
			expect(minMax2).not.to.be.equal(null);
			expect(ensureNotNull(minMax2).min).to.be.equal(2);
			expect(ensureNotNull(minMax2).max).to.be.equal(3);
		});
	});

	describe('minMaxOnRangeByPlotFunction and minMaxOnRangeByPlotFunctionCached', () => {
		const pl = new PlotList<UTCTimestamp, OHLCTuple>(new Map([
			['open', (plotListRow: OHLCTuple) => plotListRow[0]],
			['high', (plotListRow: OHLCTuple) => plotListRow[1]],
			['low', (plotListRow: OHLCTuple) => plotListRow[2]],
			['close', (plotListRow: OHLCTuple) => plotListRow[3]],
			['hl2', (plotListRow: OHLCTuple) => (ensure(plotListRow[1]) + ensure(plotListRow[2])) / 2],
			['ohlc4', (plotListRow: OHLCTuple) => (ensure(plotListRow[0]) + ensure(plotListRow[1]) + ensure(plotListRow[2]) + ensure(plotListRow[3])) / 4],
		]));

		beforeEach(() => {
			pl.clear();
			pl.add(0 as TimePointIndex, 1 as UTCTimestamp, [5, 7, 3, 6]);
			pl.add(1 as TimePointIndex, 2 as UTCTimestamp, [10, 12, 8, 11]);
			pl.add(2 as TimePointIndex, 3 as UTCTimestamp, [15, 17, 13, 16]);
			pl.add(3 as TimePointIndex, 4 as UTCTimestamp, [20, 22, 18, 21]);
			pl.add(4 as TimePointIndex, 5 as UTCTimestamp, [25, 27, 23, 26]);
		});

		it('should return correct min max for open', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'open', offset: 0 }]);
			expect(ensureNotNull(minMax).min).to.be.equal(5);
			expect(ensureNotNull(minMax).max).to.be.equal(25);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'open', offset: 0 }]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(5);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(25);
		});

		it('should return correct min max for high', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'high', offset: 0 }]);
			expect(ensureNotNull(minMax).min).to.be.equal(7);
			expect(ensureNotNull(minMax).max).to.be.equal(27);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'high', offset: 0 }]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(7);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(27);
		});

		it('should return correct min max for low', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'low', offset: 0 }]);
			expect(ensureNotNull(minMax).min).to.be.equal(3);
			expect(ensureNotNull(minMax).max).to.be.equal(23);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'low', offset: 0 }]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(3);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(23);
		});

		it('should return correct min max for close', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'close', offset: 0 }]);
			expect(ensureNotNull(minMax).min).to.be.equal(6);
			expect(ensureNotNull(minMax).max).to.be.equal(26);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'close', offset: 0 }]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(6);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(26);
		});

		it('should return correct min max for hl/2', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'hl2', offset: 0 }]);
			expect(ensureNotNull(minMax).min).to.be.equal(5);
			expect(ensureNotNull(minMax).max).to.be.equal(25);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'hl2', offset: 0 }]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(5);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(25);
		});

		it('should return correct min max for ohlc/4', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'ohlc4', offset: 0 }]);
			expect(ensureNotNull(minMax).min).to.be.equal(5.25);
			expect(ensureNotNull(minMax).max).to.be.equal(25.25);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'ohlc4', offset: 0 }]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(5.25);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(25.25);
		});

		it('should throw specific error if there is no registered function', () => {
			expect(pl.minMaxOnRangeCached.bind(pl, 0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'no_such_function', offset: 0 }]))
				.to.throw('Plot "no_such_function" is not registered');

			expect(pl.minMaxOnRangeCached.bind(pl, 0 as TimePointIndex, 4 as TimePointIndex, [{ name: 'no_such_function', offset: 0 }]))
				.to.throw('Plot "no_such_function" is not registered');
		});
	});

	describe('range', () => {
		it('should return correct range for existent data', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);

			const range1 = plotList.range(0 as TimePointIndex, 0 as TimePointIndex);
			expect(range1.size()).to.be.equal(1);

			const range2 = plotList.range(0 as TimePointIndex, 1 as TimePointIndex);
			expect(range2.size()).to.be.equal(2);

			const range3 = plotList.range(2 as TimePointIndex, 2 as TimePointIndex);
			expect(range3.size()).to.be.equal(1);
		});

		it('should correct start index to the first existent time point', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(-1 as TimePointIndex),
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
			]);

			const range = plotList.range(-10 as TimePointIndex, 0 as TimePointIndex);
			expect(range.size()).to.be.equal(2);
			expect(range.firstIndex()).to.be.equal(-1 as TimePointIndex);
			expect(range.lastIndex()).to.be.equal(0 as TimePointIndex);
		});

		it('should correct end index to the last existent time point', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(-1 as TimePointIndex),
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
			]);

			const range = plotList.range(0 as TimePointIndex, 10 as TimePointIndex);
			expect(range.size()).to.be.equal(2);
			expect(range.firstIndex()).to.be.equal(0 as TimePointIndex);
			expect(range.lastIndex()).to.be.equal(1 as TimePointIndex);
		});

		it('should correct start and end indexes to the first/last existent time point', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(-1 as TimePointIndex),
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
			]);

			const range = plotList.range(-10 as TimePointIndex, 10 as TimePointIndex);
			expect(range.size()).to.be.equal(3);
			expect(range.firstIndex()).to.be.equal(-1 as TimePointIndex);
			expect(range.lastIndex()).to.be.equal(1 as TimePointIndex);
		});

		it('should return empty plot list if there is no data in the range', () => {
			const plotList = new PlotList<UTCTimestamp, PlotValueTuple>();

			plotList.merge([
				row(-1 as TimePointIndex),
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(5 as TimePointIndex),
				row(6 as TimePointIndex),
				row(7 as TimePointIndex),
			]);

			function checkIsEmpty(pl: PlotList<UTCTimestamp, PlotValueTuple>): void {
				expect(pl.size()).to.be.equal(0);
				expect(pl.isEmpty()).to.be.equal(true);

				expect(pl.firstIndex()).to.be.equal(null);
				expect(pl.lastIndex()).to.be.equal(null);
			}

			checkIsEmpty(plotList.range(-10 as TimePointIndex, -5 as TimePointIndex));
			checkIsEmpty(plotList.range(10 as TimePointIndex, 15 as TimePointIndex));
			checkIsEmpty(plotList.range(2 as TimePointIndex, 4 as TimePointIndex));
		});
	});
});

describe('mergePlotRows', () => {
	function plotRow(index: number, data?: PlotValue): PlotRow<UTCTimestamp, [PlotValue]> {
		return { index: index as TimePointIndex, value: [data], time: 0 as UTCTimestamp };
	}

	describe('(correctness)', () => {
		it('should merge disjoint arrays', () => {
			const firstArray = [plotRow(1), plotRow(3), plotRow(5)];
			const secondArray = [plotRow(2), plotRow(4)];
			const merged = mergePlotRows(firstArray, secondArray);
			expect(merged).to.eql([plotRow(1), plotRow(2), plotRow(3), plotRow(4), plotRow(5)]);
		});

		it('should merge arrays with one overlapped item', () => {
			const firstArray = [plotRow(3), plotRow(4), plotRow(5)];
			const secondArray = [plotRow(1), plotRow(2), plotRow(3)];
			const merged = mergePlotRows(firstArray, secondArray);
			expect(merged).to.eql([plotRow(1), plotRow(2), plotRow(3), plotRow(4), plotRow(5)]);
		});

		it('should merge array with sub-array', () => {
			const array = [plotRow(1), plotRow(2), plotRow(3), plotRow(4), plotRow(5)];
			const merged = mergePlotRows(array, array.slice(1, 3));
			expect(merged).to.eql(array, 'Merged array must be equals superset\'s array');
		});

		it('should merge fully overlapped arrays', () => {
			const array = [plotRow(1), plotRow(2), plotRow(3), plotRow(4), plotRow(5)];
			const merged = mergePlotRows(array, array);
			expect(merged).to.eql(array, 'Merged array must be equals to one of overlapped array');
		});

		it('should merge arrays with primitive types regardless of arrays\' order in args', () => {
			const firstArray = [plotRow(0), plotRow(2), plotRow(4), plotRow(6)];
			const secondArray = [plotRow(1), plotRow(3), plotRow(5)];
			const firstSecondMerged = mergePlotRows(firstArray, secondArray);
			const secondFirstMerged = mergePlotRows(secondArray, firstArray);
			expect(firstSecondMerged).to.eql(secondFirstMerged);
		});

		it('should merge arrays with non-primitive types dependent of order in args', () => {
			const firstArray = [
				plotRow(0, 1000),
				plotRow(1, 2000),
				plotRow(2, 3000),
			];

			const secondArray = [
				plotRow(1, 4000),
				plotRow(2, 5000),
				plotRow(3, 6000),
			];

			const firstSecondMerged = mergePlotRows(firstArray, secondArray);
			const secondFirstMerged = mergePlotRows(secondArray, firstArray);

			expect(firstSecondMerged).not.to.be.equal(secondFirstMerged);

			expect(firstSecondMerged.length).to.be.equal(4);
			expect(firstSecondMerged).to.include.ordered.members([firstArray[0], ...secondArray]);

			expect(secondFirstMerged.length).to.be.equal(4);
			expect(secondFirstMerged).to.include.ordered.members([...firstArray, secondArray[2]]);
		});
	});

	xdescribe('(perf)', () => {
		function isSorted(array: ReadonlyArray<PlotRow<UTCTimestamp, [PlotValue]>>): boolean {
			for (let i = 1; i < array.length; ++i) {
				if (array[i - 1].index > array[i].index) {
					return false;
				}
			}

			return true;
		}

		function generateSortedPlotRows(size: number): PlotRow<UTCTimestamp, [PlotValue]>[] {
			const startIndex = (Math.random() * 1000) | 0;
			// tslint:disable-next-line:prefer-array-literal
			const array = new Array<PlotRow<UTCTimestamp, [PlotValue]>>(size);
			for (let i = 0; i < size; ++i) {
				array[i] = plotRow(startIndex + i);
			}

			return array;
		}

		function measure<T>(func: () => T): [number, T] {
			const startTime = Date.now();
			const res = func();
			return [Date.now() - startTime, res];
		}

		it('should have linear complexity', () => {
			const first1MArray = generateSortedPlotRows(1000000);
			const second1MArray = generateSortedPlotRows(1000000);
			const [total2MTime] = measure(() => mergePlotRows(first1MArray, second1MArray));

			const first3MArray = generateSortedPlotRows(3000000);
			const second3MArray = generateSortedPlotRows(3000000);
			const [total6MTime, merged6MArray] = measure(() => mergePlotRows(first3MArray, second3MArray));

			// we need to check that execution time for `N + M = 2 Millions` is more than
			// execution time for `N + M = 6 Millions` divided by 3 (and minus some delay to decrease false positive)
			// and if it is so - we have get linear complexity (approx.)
			expect(total2MTime).to.be.greaterThan((total6MTime / 3) - total2MTime * 0.3);

			expect(isSorted(merged6MArray)).to.be.true('Merged array must be sorted');
		});
	});
});
