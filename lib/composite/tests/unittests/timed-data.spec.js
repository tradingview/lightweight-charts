"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const range_impl_1 = require("../../src/model/range-impl");
const time_data_1 = require("../../src/model/time-data");
function visibleTimedValuesCase(rangeFrom, rangeTo, extendedRange, expectedFrom, expectedTo, times) {
    const barsRange = new range_impl_1.RangeImpl(rangeFrom, rangeTo);
    const timedData = times.map((t) => {
        return { time: t, x: 0 };
    });
    const actual = (0, time_data_1.visibleTimedValues)(timedData, barsRange, extendedRange);
    const expected = { from: expectedFrom, to: expectedTo };
    (0, chai_1.expect)(actual).to.be.deep.equal(expected);
}
(0, mocha_1.describe)('TimedData', () => {
    (0, mocha_1.it)('visibleTimedValues', () => {
        visibleTimedValuesCase(1, 3, false, 0, 0, []);
        visibleTimedValuesCase(1, 3, false, 0, 1, [1]);
        visibleTimedValuesCase(1, 3, false, 0, 2, [1, 2, 5]);
        visibleTimedValuesCase(1, 3, false, 1, 2, [-1, 2, 5]);
        visibleTimedValuesCase(1, 3, false, 1, 1, [-1, 5]);
        visibleTimedValuesCase(1, 3, false, 0, 0, [4, 5]);
        visibleTimedValuesCase(1, 3, false, 2, 2, [-2, -1]);
    });
    (0, mocha_1.it)('visibleTimedValues with exteded range', () => {
        visibleTimedValuesCase(1, 3, true, 0, 0, []);
        visibleTimedValuesCase(1, 3, true, 0, 1, [1]);
        visibleTimedValuesCase(1, 3, true, 0, 3, [1, 2, 5]);
        visibleTimedValuesCase(1, 3, true, 1, 4, [-2, -1, 2, 5, 6]);
    });
});
