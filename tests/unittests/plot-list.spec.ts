import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ensureNotNull } from '../../src/helpers/assertions';
import { PlotRow, PlotRowValue, PlotRowValueIndex } from '../../src/model/plot-data';
import { MismatchDirection, PlotList } from '../../src/model/plot-list';
import { OriginalTime, TimePoint, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

function timePoint(val: number): TimePoint {
	return { timestamp: val as UTCTimestamp };
}

function plotRow(index: TimePointIndex, time: TimePoint, value: PlotRowValue): PlotRow {
	return { index, time, value, originalTime: time as unknown as OriginalTime };
}

describe('PlotList', () => {
	let p: PlotList;

	beforeEach(() => {
		p = new PlotList();
		p.setData([
			plotRow(-3 as TimePointIndex, timePoint(2), [1, 2, 3, 4]),
			plotRow(0 as TimePointIndex, timePoint(3), [10, 20, 30, 40]),
			plotRow(3 as TimePointIndex, timePoint(4), [100, 200, 300, 500]),
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

	describe('search', () => {
		it('should find respective values by given index and search strategy', () => {
			const p1 = new PlotList();
			p1.setData([
				plotRow(-5 as TimePointIndex, timePoint(1), [1, 2, 3, 4]),
				plotRow(0 as TimePointIndex, timePoint(2), [10, 20, 30, 40]),
				plotRow(5 as TimePointIndex, timePoint(3), [100, 200, 300, 400]),
			]);

			expect(p1.search(-10 as TimePointIndex, MismatchDirection.NearestLeft)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex, MismatchDirection.NearestLeft)).to.deep.include({ index: -5 as TimePointIndex, value: [1, 2, 3, 4] });
			expect(p1.search(3 as TimePointIndex, MismatchDirection.NearestLeft)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(1 as TimePointIndex, MismatchDirection.NearestLeft)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(-6 as TimePointIndex, MismatchDirection.None)).to.be.equal(null);
			expect(p1.search(-5 as TimePointIndex)).to.deep.include({ index: -5 as TimePointIndex, value: [1, 2, 3, 4] });
			expect(p1.search(0 as TimePointIndex)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(5 as TimePointIndex)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300, 400] });
			expect(p1.search(6 as TimePointIndex)).to.be.equal(null);
			expect(p1.search(-3 as TimePointIndex, MismatchDirection.NearestRight)).to.deep.include({ index: 0 as TimePointIndex, value: [10, 20, 30, 40] });
			expect(p1.search(3 as TimePointIndex, MismatchDirection.NearestRight)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300, 400] });
			expect(p1.search(5 as TimePointIndex, MismatchDirection.NearestRight)).to.deep.include({ index: 5 as TimePointIndex, value: [100, 200, 300, 400] });
			expect(p1.search(6 as TimePointIndex, MismatchDirection.NearestRight)).to.be.equal(null);
		});
	});

	describe('minMaxOnRangeCached', () => {
		it('should find minMax in numbers', () => {
			const pl = new PlotList();
			pl.setData([
				plotRow(0 as TimePointIndex, timePoint(1), [0, 0, 0, 1]),
				plotRow(1 as TimePointIndex, timePoint(2), [0, 0, 0, 2]),
				plotRow(2 as TimePointIndex, timePoint(3), [0, 0, 0, 3]),
				plotRow(3 as TimePointIndex, timePoint(4), [0, 0, 0, 4]),
				plotRow(4 as TimePointIndex, timePoint(5), [0, 0, 0, 5]),
			]);

			const plots = [PlotRowValueIndex.Close];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 4 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(5);
		});

		it('should find minMax with non subsequent indices', () => {
			const pl = new PlotList();
			pl.setData([
				plotRow(0 as TimePointIndex, timePoint(1), [0, 0, 0, 1]),
				plotRow(2 as TimePointIndex, timePoint(2), [0, 0, 0, 2]),
				plotRow(4 as TimePointIndex, timePoint(3), [0, 0, 0, 3]),
				plotRow(6 as TimePointIndex, timePoint(4), [0, 0, 0, 4]),
				plotRow(20 as TimePointIndex, timePoint(5), [0, 0, 0, 10]),
				plotRow(100 as TimePointIndex, timePoint(6), [0, 0, 0, 5]),
			]);

			const plots = [PlotRowValueIndex.Close];

			const minMax = pl.minMaxOnRangeCached(0 as TimePointIndex, 100 as TimePointIndex, plots);
			expect(minMax).not.to.be.equal(null);
			expect(ensureNotNull(minMax).min).to.be.equal(1);
			expect(ensureNotNull(minMax).max).to.be.equal(10);
		});

		it('should return correct values if the data has gaps and we start search with second-to-last chunk', () => {
			const pl = new PlotList();
			pl.setData([
				plotRow(29 as TimePointIndex, timePoint(1), [1, 1, 1, 1]),
				plotRow(31 as TimePointIndex, timePoint(2), [2, 2, 2, 2]),
				plotRow(55 as TimePointIndex, timePoint(3), [3, 3, 3, 3]),
				plotRow(65 as TimePointIndex, timePoint(4), [4, 4, 4, 4]),
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
		let pl: PlotList;

		beforeEach(() => {
			pl = new PlotList();
			pl.setData([
				plotRow(0 as TimePointIndex, timePoint(1), [5, 7, 3, 6]),
				plotRow(1 as TimePointIndex, timePoint(2), [10, 12, 8, 11]),
				plotRow(2 as TimePointIndex, timePoint(3), [15, 17, 13, 16]),
				plotRow(3 as TimePointIndex, timePoint(4), [20, 22, 18, 21]),
				plotRow(4 as TimePointIndex, timePoint(5), [25, 27, 23, 26]),
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
