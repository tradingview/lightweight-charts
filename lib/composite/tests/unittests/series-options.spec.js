"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const series_options_1 = require("../../src/model/series-options");
(0, mocha_1.describe)('SeriesOptions', () => {
    (0, mocha_1.it)('precisionByMinMove', () => {
        (0, chai_1.expect)((0, series_options_1.precisionByMinMove)(0.001)).to.be.equal(3);
        (0, chai_1.expect)((0, series_options_1.precisionByMinMove)(0.01)).to.be.equal(2);
        (0, chai_1.expect)((0, series_options_1.precisionByMinMove)(0.1)).to.be.equal(1);
        (0, chai_1.expect)((0, series_options_1.precisionByMinMove)(1)).to.be.equal(0);
        (0, chai_1.expect)((0, series_options_1.precisionByMinMove)(10)).to.be.equal(0);
        (0, chai_1.expect)((0, series_options_1.precisionByMinMove)(0.25)).to.be.equal(2);
    });
});
