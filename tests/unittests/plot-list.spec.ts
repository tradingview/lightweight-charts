import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ensureNotNull } from '../../src/helpers/assertions';
import { PlotRowValueIndex } from '../../src/model/plot-data';
import { PlotList, PlotRowSearchMode } from '../../src/model/plot-list';
import { TimePoint, TimePointIndex, UTCTimestamp } from '../../src/model/time-data';

function timePoint(val: number): TimePoint {
	return { timestamp: val as UTCTimestamp };
}

describe('PlotList', () => {
	let p: PlotList;

	beforeEach(() => {
		p = new PlotList();
		p.setData([
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

	describe('search', () => {
		it('should find respective values by given index and search strategy', () => {
			const p1 = new PlotList();
			p1.setData([
				{ index: -5 as TimePointIndex, time: timePoint(1), value: [1, 2, 3, 4] },
				{ index: 0 as TimePointIndex, time: timePoint(2), value: [10, 20, 30, 40] },
				{ index: 5 as TimePointIndex, time: timePoint(3), value: [100, 200, 300, 400] },
			]);

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
		it('should find minMax in numbers', () => {
			const pl = new PlotList();
			pl.setData([
				{ index: 0 as TimePointIndex, time: timePoint(1), value: [0, 0, 0, 1] },
				{ index: 1 as TimePointIndex, time: timePoint(2), value: [0, 0, 0, 2] },
				{ index: 2 as TimePointIndex, time: timePoint(3), value: [0, 0, 0, 3] },
				{ index: 3 as TimePointIndex, time: timePoint(4), value: [0, 0, 0, 4] },
				{ index: 4 as TimePointIndex, time: timePoint(5), value: [0, 0, 0, 5] },
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
			const pl = new PlotList();
			pl.setData([
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
		let pl: PlotList;

		beforeEach(() => {
			pl = new PlotList();
			pl.setData([
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
