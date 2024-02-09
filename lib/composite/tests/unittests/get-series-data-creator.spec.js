"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const get_series_data_creator_1 = require("../../src/api/get-series-data-creator");
const plotRow = {
    index: 0,
    time: { timestamp: 1649931070 },
    value: [1, 2, 3, 4],
    originalTime: 1649931070,
};
const linePlotRows = [
    Object.assign(Object.assign({}, plotRow), { color: '#FF0000' }),
    plotRow,
];
const areaPlotRows = [
    Object.assign(Object.assign({}, plotRow), { lineColor: '#FF0000', topColor: '#00FF00', bottomColor: '#0000FF' }),
    plotRow,
];
const baselinePlotRows = [
    Object.assign(Object.assign({}, plotRow), { topFillColor1: '#000001', topFillColor2: '#000002', topLineColor: '#000003', bottomFillColor1: '#000004', bottomFillColor2: '#000005', bottomLineColor: '#000006' }),
    plotRow,
];
const histogramPlotRow = [
    Object.assign(Object.assign({}, plotRow), { color: '#00FF00' }),
    plotRow,
];
const barPlotRow = [
    Object.assign(Object.assign({}, plotRow), { color: '#0000FF' }),
    plotRow,
];
const candlestickPlotRows = [
    Object.assign(Object.assign({}, plotRow), { color: '#0000FF' }),
    plotRow,
    Object.assign(Object.assign({}, plotRow), { borderColor: '#FFFF00' }),
    Object.assign(Object.assign({}, plotRow), { wickColor: '#FF00FF' }),
    Object.assign(Object.assign({}, plotRow), { color: '#FF0000', borderColor: '#00FF00', wickColor: '#0000FF' }),
];
(0, mocha_1.describe)('getSeriesDataCreator', () => {
    (0, mocha_1.it)('Line', () => {
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Line')(linePlotRows[0])).to.deep.equal({
            value: 4,
            time: 1649931070,
            color: '#FF0000',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Line')(linePlotRows[1])).to.deep.equal({
            value: 4,
            time: 1649931070,
        });
    });
    (0, mocha_1.it)('Area', () => {
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Area')(areaPlotRows[0])).to.deep.equal({
            value: 4,
            time: 1649931070,
            lineColor: '#FF0000',
            topColor: '#00FF00',
            bottomColor: '#0000FF',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Area')(areaPlotRows[1])).to.deep.equal({
            value: 4,
            time: 1649931070,
        });
    });
    (0, mocha_1.it)('Baseline', () => {
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Baseline')(baselinePlotRows[0])).to.deep.equal({
            value: 4,
            time: 1649931070,
            topFillColor1: '#000001',
            topFillColor2: '#000002',
            topLineColor: '#000003',
            bottomFillColor1: '#000004',
            bottomFillColor2: '#000005',
            bottomLineColor: '#000006',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Baseline')(baselinePlotRows[1])).to.deep.equal({
            value: 4,
            time: 1649931070,
        });
    });
    (0, mocha_1.it)('Histogram', () => {
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Histogram')(histogramPlotRow[0])).to.deep.equal({
            value: 4,
            time: 1649931070,
            color: '#00FF00',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Histogram')(histogramPlotRow[1])).to.deep.equal({
            value: 4,
            time: 1649931070,
        });
    });
    (0, mocha_1.it)('Bar', () => {
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Bar')(barPlotRow[0])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
            color: '#0000FF',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Bar')(barPlotRow[1])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
        });
    });
    (0, mocha_1.it)('Candlestick', () => {
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Candlestick')(candlestickPlotRows[0])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
            color: '#0000FF',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Candlestick')(candlestickPlotRows[1])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Candlestick')(candlestickPlotRows[2])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
            borderColor: '#FFFF00',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Candlestick')(candlestickPlotRows[3])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
            wickColor: '#FF00FF',
        });
        (0, chai_1.expect)((0, get_series_data_creator_1.getSeriesDataCreator)('Candlestick')(candlestickPlotRows[4])).to.deep.equal({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            time: 1649931070,
            color: '#FF0000',
            borderColor: '#00FF00',
            wickColor: '#0000FF',
        });
    });
});
