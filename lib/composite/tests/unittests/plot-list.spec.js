"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const assertions_1 = require("../../src/helpers/assertions");
const plot_list_1 = require("../../src/model/plot-list");
function timePoint(val) {
    return { timestamp: val };
}
function plotRow(index, time, value) {
    return { index, time: time, value, originalTime: time };
}
(0, mocha_1.describe)('PlotList', () => {
    let p;
    beforeEach(() => {
        p = new plot_list_1.PlotList();
        p.setData([
            plotRow(-3, timePoint(2), [1, 2, 3, 4]),
            plotRow(0, timePoint(3), [10, 20, 30, 40]),
            plotRow(3, timePoint(4), [100, 200, 300, 500]),
        ]);
    });
    (0, mocha_1.it)('should contain all plot values that was previously added', () => {
        (0, chai_1.expect)(p.size()).to.be.equal(3);
        (0, chai_1.expect)(p.contains(-3)).to.be.equal(true);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(-3)).value).to.include.ordered.members([1, 2, 3]);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(-3)).time).to.have.deep.equal(timePoint(2));
        (0, chai_1.expect)(p.contains(0)).to.be.equal(true);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(0)).value).to.include.ordered.members([10, 20, 30]);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(0)).time).to.have.deep.equal(timePoint(3));
        (0, chai_1.expect)(p.contains(3)).to.be.equal(true);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(3)).value).to.include.ordered.members([100, 200, 300]);
        (0, chai_1.expect)((0, assertions_1.ensureNotNull)(p.valueAt(3)).time).to.have.deep.equal(timePoint(4));
    });
    (0, mocha_1.it)('should not contain any extraneous plot values', () => {
        (0, chai_1.expect)(p.contains(1)).to.be.equal(false);
    });
    (0, mocha_1.describe)('search', () => {
        (0, mocha_1.it)('should find respective values by given index and search strategy', () => {
            const p1 = new plot_list_1.PlotList();
            p1.setData([
                plotRow(-5, timePoint(1), [1, 2, 3, 4]),
                plotRow(0, timePoint(2), [10, 20, 30, 40]),
                plotRow(5, timePoint(3), [100, 200, 300, 400]),
            ]);
            (0, chai_1.expect)(p1.search(-10, -1 /* MismatchDirection.NearestLeft */)).to.be.equal(null);
            (0, chai_1.expect)(p1.search(-5, -1 /* MismatchDirection.NearestLeft */)).to.deep.include({ index: -5, value: [1, 2, 3, 4] });
            (0, chai_1.expect)(p1.search(3, -1 /* MismatchDirection.NearestLeft */)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(1, -1 /* MismatchDirection.NearestLeft */)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(-6, 0 /* MismatchDirection.None */)).to.be.equal(null);
            (0, chai_1.expect)(p1.search(-5)).to.deep.include({ index: -5, value: [1, 2, 3, 4] });
            (0, chai_1.expect)(p1.search(0)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(5)).to.deep.include({ index: 5, value: [100, 200, 300, 400] });
            (0, chai_1.expect)(p1.search(6)).to.be.equal(null);
            (0, chai_1.expect)(p1.search(-3, 1 /* MismatchDirection.NearestRight */)).to.deep.include({ index: 0, value: [10, 20, 30, 40] });
            (0, chai_1.expect)(p1.search(3, 1 /* MismatchDirection.NearestRight */)).to.deep.include({ index: 5, value: [100, 200, 300, 400] });
            (0, chai_1.expect)(p1.search(5, 1 /* MismatchDirection.NearestRight */)).to.deep.include({ index: 5, value: [100, 200, 300, 400] });
            (0, chai_1.expect)(p1.search(6, 1 /* MismatchDirection.NearestRight */)).to.be.equal(null);
        });
    });
    (0, mocha_1.describe)('minMaxOnRangeCached', () => {
        (0, mocha_1.it)('should find minMax in numbers', () => {
            const pl = new plot_list_1.PlotList();
            pl.setData([
                plotRow(0, timePoint(1), [0, 0, 0, 1]),
                plotRow(1, timePoint(2), [0, 0, 0, 2]),
                plotRow(2, timePoint(3), [0, 0, 0, 3]),
                plotRow(3, timePoint(4), [0, 0, 0, 4]),
                plotRow(4, timePoint(5), [0, 0, 0, 5]),
            ]);
            const plots = [3 /* PlotRowValueIndex.Close */];
            const minMax = pl.minMaxOnRangeCached(0, 4, plots);
            (0, chai_1.expect)(minMax).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(1);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(5);
        });
        (0, mocha_1.it)('should find minMax with non subsequent indices', () => {
            const pl = new plot_list_1.PlotList();
            pl.setData([
                plotRow(0, timePoint(1), [0, 0, 0, 1]),
                plotRow(2, timePoint(2), [0, 0, 0, 2]),
                plotRow(4, timePoint(3), [0, 0, 0, 3]),
                plotRow(6, timePoint(4), [0, 0, 0, 4]),
                plotRow(20, timePoint(5), [0, 0, 0, 10]),
                plotRow(100, timePoint(6), [0, 0, 0, 5]),
            ]);
            const plots = [3 /* PlotRowValueIndex.Close */];
            const minMax = pl.minMaxOnRangeCached(0, 100, plots);
            (0, chai_1.expect)(minMax).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(1);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(10);
        });
        (0, mocha_1.it)('should return correct values if the data has gaps and we start search with second-to-last chunk', () => {
            const pl = new plot_list_1.PlotList();
            pl.setData([
                plotRow(29, timePoint(1), [1, 1, 1, 1]),
                plotRow(31, timePoint(2), [2, 2, 2, 2]),
                plotRow(55, timePoint(3), [3, 3, 3, 3]),
                plotRow(65, timePoint(4), [4, 4, 4, 4]),
            ]);
            const plots = [1 /* PlotRowValueIndex.High */];
            const minMax = pl.minMaxOnRangeCached(30, 200, plots);
            (0, chai_1.expect)(minMax).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(2);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(4);
            const minMax2 = pl.minMaxOnRangeCached(30, 60, plots);
            (0, chai_1.expect)(minMax2).not.to.be.equal(null);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax2).min).to.be.equal(2);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax2).max).to.be.equal(3);
        });
    });
    (0, mocha_1.describe)('minMaxOnRangeByPlotFunction and minMaxOnRangeByPlotFunctionCached', () => {
        let pl;
        beforeEach(() => {
            pl = new plot_list_1.PlotList();
            pl.setData([
                plotRow(0, timePoint(1), [5, 7, 3, 6]),
                plotRow(1, timePoint(2), [10, 12, 8, 11]),
                plotRow(2, timePoint(3), [15, 17, 13, 16]),
                plotRow(3, timePoint(4), [20, 22, 18, 21]),
                plotRow(4, timePoint(5), [25, 27, 23, 26]),
            ]);
        });
        (0, mocha_1.it)('should return correct min max for open', () => {
            const minMax = pl.minMaxOnRangeCached(0, 4, [0 /* PlotRowValueIndex.Open */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(5);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(25);
            const minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [0 /* PlotRowValueIndex.Open */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(5);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(25);
        });
        (0, mocha_1.it)('should return correct min max for high', () => {
            const minMax = pl.minMaxOnRangeCached(0, 4, [1 /* PlotRowValueIndex.High */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(7);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(27);
            const minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [1 /* PlotRowValueIndex.High */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(7);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(27);
        });
        (0, mocha_1.it)('should return correct min max for low', () => {
            const minMax = pl.minMaxOnRangeCached(0, 4, [2 /* PlotRowValueIndex.Low */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(3);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(23);
            const minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [2 /* PlotRowValueIndex.Low */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(3);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(23);
        });
        (0, mocha_1.it)('should return correct min max for close', () => {
            const minMax = pl.minMaxOnRangeCached(0, 4, [3 /* PlotRowValueIndex.Close */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).min).to.be.equal(6);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMax).max).to.be.equal(26);
            const minMaxNonCached = pl.minMaxOnRangeCached(0, 4, [3 /* PlotRowValueIndex.Close */]);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).min).to.be.equal(6);
            (0, chai_1.expect)((0, assertions_1.ensureNotNull)(minMaxNonCached).max).to.be.equal(26);
        });
    });
});
