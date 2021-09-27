import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ensureNotNull } from '../../src/helpers/assertions';
import { PlotRow, PlotRowValueIndex } from '../../src/model/plot-data';
import { mergePlotRows, PlotList, PlotRowSearchMode } from '../../src/model/plot-list';
import { TimePoint, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

function timePoint(val: number): TimePoint {
	return { timestamp: val as UTCTimestamp };
}

function row(i: number, val?: number): PlotRow {
	return { index: i as TimePointIndex, value: val !== undefined ? [val, val, val, val] : [i * 3, i * 3 + 1, i * 3 + 2, i * 3 + 3], time: timePoint(0) };
}

describe('PlotList', () => {
	const p = new PlotList();

	beforeEach(() => {
		p.clear();
		p.merge([
			{ index: -3 as TimePointIndex, time: timePoint(2), value: [1, 2, 3, 4] },
			{ index: 0 as TimePointIndex, time: timePoint(3), value: [10, 20, 30, 40] },
			{ index: 3 as TimePointIndex, time: timePoint(4), value: [100, 200, 300, 500] },
		]);
	});

	it('should contain all plot values that was previously added', () => {
		expect(p.size()).to.be.equal(3);
		expect(p.contains(-3 as TimePointIndex)).to.be.equal(true);
		expect(ensureNotNull(p.valueAt(-3 as TimePointIndex)).value).to.include.ordered.members([1, 2, 3]);
		expect(ensureNotNull(p.valueAt(-3 as TimePointIndex)).time).to.have.deep.equal(timePoint(2));
		expect(p.contains(0 as TimePointIndex)).to.be.equal(true);
		expect(ensureNotNull(p.valueAt(0 as TimePointIndex)).value).to.include.ordered.members([10, 20, 30]);
		expect(ensureNotNull(p.valueAt(0 as TimePointIndex)).time).to.have.deep.equal(timePoint(3));
		expect(p.contains(3 as TimePointIndex)).to.be.equal(true);
		expect(ensureNotNull(p.valueAt(3 as TimePointIndex)).value).to.include.ordered.members([100, 200, 300]);
		expect(ensureNotNull(p.valueAt(3 as TimePointIndex)).time).to.have.deep.equal(timePoint(4));
	});

	it('should not contain any extraneous plot values', () => {
		expect(p.contains(1 as TimePointIndex)).to.be.equal(false);
	});

	it('should remove all plot values after calling \'clear\'', () => {
		p.clear();

		expect(p.isEmpty()).to.be.equal(true);
		expect(p.size()).to.be.equal(0);
	});

	describe('merge', () => {
		it('should correctly insert new and update existing plot values', () => {
			const plotList = new PlotList();

			// first merge
			plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);

			// second merge
			plotList.merge([
				row(2 as TimePointIndex),
			]);

			// third merge
			plotList.merge([
				row(-5 as TimePointIndex),
				row(0 as TimePointIndex),
				row(25 as TimePointIndex),
			]);

			// final result
			const items = plotList.rows();
			expect(items.length).to.be.equal(5);
			expect(items[0].value).to.include.ordered.members([-15, -14, -13]);
			expect(items[1].value).to.include.ordered.members([0, 1, 2]);
			expect(items[2].value).to.include.ordered.members([3, 4, 5]);
			expect(items[3].value).to.include.ordered.members([6, 7, 8]);
			expect(items[4].value).to.include.ordered.members([75, 76, 77]);
		});

		it('should correctly prepend new plot values', () => {
			const plotList = new PlotList();

			plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);

			plotList.merge([
				row(-2 as TimePointIndex),
				row(-1 as TimePointIndex),
			]);

			expect(plotList.size()).to.be.equal(5);
			expect(ensureNotNull(plotList.valueAt(-2 as TimePointIndex)).value).to.include.ordered.members(row(-2 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(-1 as TimePointIndex)).value).to.include.ordered.members(row(-1 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(0 as TimePointIndex)).value).to.include.ordered.members(row(0 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(1 as TimePointIndex)).value).to.include.ordered.members(row(1 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(2 as TimePointIndex)).value).to.include.ordered.members(row(2 as TimePointIndex).value);
		});

		it('should correctly append new plot values', () => {
			const plotList = new PlotList();

			plotList.merge([
				row(0 as TimePointIndex),
				row(1 as TimePointIndex),
				row(2 as TimePointIndex),
			]);

			plotList.merge([
				row(3 as TimePointIndex),
				row(4 as TimePointIndex),
			]);

			expect(plotList.size()).to.be.equal(5);
			expect(ensureNotNull(plotList.valueAt(0 as TimePointIndex)).value).to.include.ordered.members(row(0 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(1 as TimePointIndex)).value).to.include.ordered.members(row(1 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(2 as TimePointIndex)).value).to.include.ordered.members(row(2 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(3 as TimePointIndex)).value).to.include.ordered.members(row(3 as TimePointIndex).value);
			expect(ensureNotNull(plotList.valueAt(4 as TimePointIndex)).value).to.include.ordered.members(row(4 as TimePointIndex).value);
		});
	});

	describe('search', () => {
		const p1 = new PlotList();

		beforeEach(() => {
			p1.clear();
			p1.merge([
				{ index: -5 as TimePointIndex, time: timePoint(1), value: [1, 2, 3, 4] },
				{ index: 0 as TimePointIndex, time: timePoint(2), value: [10, 20, 30, 40] },
				{ index: 5 as TimePointIndex, time: timePoint(3), value: [100, 200, 300, 400] },
			]);
		});

		it('should find respective values by given index and search strategy', () => {
			expect(p1.search(-10 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.deep.include({ index: -5 as TimePointIndex, value: [1, 2, 3, 4] });
			expect(p1.search(3 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(1 as TimePointIndex, PlotRowSearchMode.NearestLeft)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(-6 as TimePointIndex, PlotRowSearchMode.Exact)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex)).to.deep.include({ index: -5 as TimePointIndex, value: [1, 2, 3, 4] });
			expect(p1.search(0 as TimePointIndex)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(5 as TimePointIndex)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300, 400] });
			expect(p1.search(6 as TimePointIndex)).to.be.equal(null);
			expect(p1.search(-3 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(3 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300, 400] });
			expect(p1.search(5 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300, 400] });
			expect(p1.search(6 as TimePointIndex, PlotRowSearchMode.NearestRight)).to.be.equal(null);
		});
	});

	describe('minMaxOnRangeCached', () => {
		const pl = new PlotList();

		beforeEach(() => {
			pl.clear();
			pl.merge([
				{ index: 0 as TimePointIndex, time: timePoint(1), value: [0, 0, 0, 1] },
				{ index: 1 as TimePointIndex, time: timePoint(2), value: [0, 0, 0, 2] },
				{ index: 2 as TimePointIndex, time: timePoint(3), value: [0, 0, 0, 3] },
				{ index: 3 as TimePointIndex, time: timePoint(4), value: [0, 0, 0, 4] },
				{ index: 4 as TimePointIndex, time: timePoint(5), value: [0, 0, 0, 5] },
			]);
		});

		it('should find minMax in numbers', () => {
			const plots = [PlotRowValueIndex.Close];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(5);
		});

		it('should find minMax with non subsequent indices', () => {
			pl.clear();
			pl.merge([
				{ index: 0 as TimePointIndex, time: timePoint(1), value: [0, 0, 0, 1] },
				{ index: 2 as TimePointIndex, time: timePoint(2), value: [0, 0, 0, 2] },
				{ index: 4 as TimePointIndex, time: timePoint(3), value: [0, 0, 0, 3] },
				{ index: 6 as TimePointIndex, time: timePoint(4), value: [0, 0, 0, 4] },
				{ index: 20 as TimePointIndex, time: timePoint(5), value: [0, 0, 0, 10] },
				{ index: 100 as TimePointIndex, time: timePoint(6), value: [0, 0, 0, 5] },
			]);

			const plots = [PlotRowValueIndex.Close];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 100 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(10);
		});

		it('should return correct values if the data has gaps and we start search with second-to-last chunk', () => {
			pl.clear();
			pl.merge([
				{ index: 29 as TimePointIndex, time: timePoint(1), value: [1, 1, 1, 1] },
				{ index: 31 as TimePointIndex, time: timePoint(2), value: [2, 2, 2, 2] },
				{ index: 55 as TimePointIndex, time: timePoint(3), value: [3, 3, 3, 3] },
				{ index: 65 as TimePointIndex, time: timePoint(4), value: [4, 4, 4, 4] },
			]);

			const plots = [PlotRowValueIndex.High];

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
		const pl = new PlotList();

		beforeEach(() => {
			pl.clear();
			pl.merge([
				{ index: 0 as TimePointIndex, time: timePoint(1), value: [5, 7, 3, 6] },
				{ index: 1 as TimePointIndex, time: timePoint(2), value: [10, 12, 8, 11] },
				{ index: 2 as TimePointIndex, time: timePoint(3), value: [15, 17, 13, 16] },
				{ index: 3 as TimePointIndex, time: timePoint(4), value: [20, 22, 18, 21] },
				{ index: 4 as TimePointIndex, time: timePoint(5), value: [25, 27, 23, 26] },
			]);
		});

		it('should return correct min max for open', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.Open]);
			expect(ensureNotNull(minMax).min).to.be.equal(5);
			expect(ensureNotNull(minMax).max).to.be.equal(25);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.Open]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(5);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(25);
		});

		it('should return correct min max for high', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.High]);
			expect(ensureNotNull(minMax).min).to.be.equal(7);
			expect(ensureNotNull(minMax).max).to.be.equal(27);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.High]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(7);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(27);
		});

		it('should return correct min max for low', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.Low]);
			expect(ensureNotNull(minMax).min).to.be.equal(3);
			expect(ensureNotNull(minMax).max).to.be.equal(23);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.Low]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(3);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(23);
		});

		it('should return correct min max for close', () => {
			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.Close]);
			expect(ensureNotNull(minMax).min).to.be.equal(6);
			expect(ensureNotNull(minMax).max).to.be.equal(26);

			const minMaxNonCached = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, [PlotRowValueIndex.Close]);
			expect(ensureNotNull(minMaxNonCached).min).to.be.equal(6);
			expect(ensureNotNull(minMaxNonCached).max).to.be.equal(26);
		});
	});
});

describe('mergePlotRows', () => {
	describe('(correctness)', () => {
		it('should merge disjoint arrays', () => {
			const firstArray = [row(1), row(3), row(5)];
			const secondArray = [row(2), row(4)];
			const merged = mergePlotRows(firstArray, secondArray);
			expect(merged).to.eql([row(1), row(2), row(3), row(4), row(5)]);
		});

		it('should merge arrays with one overlapped item', () => {
			const firstArray = [row(3), row(4), row(5)];
			const secondArray = [row(1), row(2), row(3)];
			const merged = mergePlotRows(firstArray, secondArray);
			expect(merged).to.eql([row(1), row(2), row(3), row(4), row(5)]);
		});

		it('should merge array with sub-array', () => {
			const array = [row(1), row(2), row(3), row(4), row(5)];
			const merged = mergePlotRows(array, array.slice(1, 3));
			expect(merged).to.eql(array, 'Merged array must be equals superset\'s array');
		});

		it('should merge fully overlapped arrays', () => {
			const array = [row(1), row(2), row(3), row(4), row(5)];
			const merged = mergePlotRows(array, array);
			expect(merged).to.eql(array, 'Merged array must be equals to one of overlapped array');
		});

		it('should merge arrays with primitive types regardless of arrays\' order in args', () => {
			const firstArray = [row(0), row(2), row(4), row(6)];
			const secondArray = [row(1), row(3), row(5)];
			const firstSecondMerged = mergePlotRows(firstArray, secondArray);
			const secondFirstMerged = mergePlotRows(secondArray, firstArray);
			expect(firstSecondMerged).to.eql(secondFirstMerged);
		});

		it('should merge arrays with non-primitive types dependent of order in args', () => {
			const firstArray = [
				row(0, 1000),
				row(1, 2000),
				row(2, 3000),
			];

			const secondArray = [
				row(1, 4000),
				row(2, 5000),
				row(3, 6000),
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
		function isSorted(array: readonly PlotRow[]): boolean {
			for (let i = 1; i < array.length; ++i) {
				if (array[i - 1].index > array[i].index) {
					return false;
				}
			}

			return true;
		}

		function generateSortedPlotRows(size: number): PlotRow[] {
			const startIndex = (Math.random() * 1000) | 0;
			const array = new Array<PlotRow>(size);
			for (let i = 0; i < size; ++i) {
				array[i] = row(startIndex + i);
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
