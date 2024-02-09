"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const get_series_plot_row_creator_1 = require("../../src/model/get-series-plot-row-creator");
(0, mocha_1.describe)('getSeriesPlotRowCreator', () => {
    (0, mocha_1.it)('Line', () => {
        (0, chai_1.expect)((0, get_series_plot_row_creator_1.getSeriesPlotRowCreator)('Line')({ timestamp: 1649931070 }, 0, {
            value: 4,
            time: 1649931070,
            color: '#FF0000',
        }, 1649931070)).to.deep.equal({
            index: 0,
            time: { timestamp: 1649931070 },
            value: [4, 4, 4, 4],
            originalTime: 1649931070,
            color: '#FF0000',
        });
    });
    (0, mocha_1.it)('Area', () => {
        (0, chai_1.expect)((0, get_series_plot_row_creator_1.getSeriesPlotRowCreator)('Area')({ timestamp: 1649931070 }, 0, {
            value: 4,
            time: 1649931070,
            lineColor: '#FF0000',
            topColor: '#00FF00',
            bottomColor: '#0000FF',
        }, 1649931070)).to.deep.equal({
            index: 0,
            time: { timestamp: 1649931070 },
            value: [4, 4, 4, 4],
            originalTime: 1649931070,
            lineColor: '#FF0000',
            topColor: '#00FF00',
            bottomColor: '#0000FF',
        });
    });
    (0, mocha_1.it)('Baseline', () => {
        (0, chai_1.expect)((0, get_series_plot_row_creator_1.getSeriesPlotRowCreator)('Baseline')({ timestamp: 1649931070 }, 0, {
            value: 4,
            time: 1649931070,
            topFillColor1: '#000001',
            topFillColor2: '#000002',
            topLineColor: '#000003',
            bottomFillColor1: '#000004',
            bottomFillColor2: '#000005',
            bottomLineColor: '#000006',
        }, 1649931070)).to.deep.equal({
            index: 0,
            time: { timestamp: 1649931070 },
            value: [4, 4, 4, 4],
            originalTime: 1649931070,
            topFillColor1: '#000001',
            topFillColor2: '#000002',
            topLineColor: '#000003',
            bottomFillColor1: '#000004',
            bottomFillColor2: '#000005',
            bottomLineColor: '#000006',
        });
    });
    (0, mocha_1.it)('Histogram', () => {
        (0, chai_1.expect)((0, get_series_plot_row_creator_1.getSeriesPlotRowCreator)('Histogram')({ timestamp: 1649931070 }, 0, {
            value: 4,
            time: 1649931070,
            color: '#FF0000',
        }, 1649931070)).to.deep.equal({
            index: 0,
            time: { timestamp: 1649931070 },
            value: [4, 4, 4, 4],
            originalTime: 1649931070,
            color: '#FF0000',
        });
    });
    (0, mocha_1.it)('Bar', () => {
        (0, chai_1.expect)((0, get_series_plot_row_creator_1.getSeriesPlotRowCreator)('Bar')({ timestamp: 1649931070 }, 0, {
            open: 1,
            high: 3,
            low: 0,
            close: 2,
            time: 1649931070,
            color: '#FF0000',
        }, 1649931070)).to.deep.equal({
            index: 0,
            time: { timestamp: 1649931070 },
            value: [1, 3, 0, 2],
            originalTime: 1649931070,
            color: '#FF0000',
        });
    });
    (0, mocha_1.it)('Candlestick', () => {
        (0, chai_1.expect)((0, get_series_plot_row_creator_1.getSeriesPlotRowCreator)('Candlestick')({ timestamp: 1649931070 }, 0, {
            open: 1,
            high: 3,
            low: 0,
            close: 2,
            time: 1649931070,
            color: '#FF0000',
            borderColor: '#00FF00',
            wickColor: '#0000FF',
        }, 1649931070)).to.deep.equal({
            index: 0,
            time: { timestamp: 1649931070 },
            value: [1, 3, 0, 2],
            originalTime: 1649931070,
            color: '#FF0000',
            borderColor: '#00FF00',
            wickColor: '#0000FF',
        });
    });
});
