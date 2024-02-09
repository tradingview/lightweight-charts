"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeriesPlotRowCreator = exports.isSeriesPlotRow = void 0;
const tslib_1 = require("tslib");
const assertions_1 = require("../helpers/assertions");
const data_consumer_1 = require("./data-consumer");
function getColoredLineBasedSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { index, time, value: [val, val, val, val], originalTime };
    if (item.color !== undefined) {
        res.color = item.color;
    }
    return res;
}
function getAreaSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { index, time, value: [val, val, val, val], originalTime };
    if (item.lineColor !== undefined) {
        res.lineColor = item.lineColor;
    }
    if (item.topColor !== undefined) {
        res.topColor = item.topColor;
    }
    if (item.bottomColor !== undefined) {
        res.bottomColor = item.bottomColor;
    }
    return res;
}
function getBaselineSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { index, time, value: [val, val, val, val], originalTime };
    if (item.topLineColor !== undefined) {
        res.topLineColor = item.topLineColor;
    }
    if (item.bottomLineColor !== undefined) {
        res.bottomLineColor = item.bottomLineColor;
    }
    if (item.topFillColor1 !== undefined) {
        res.topFillColor1 = item.topFillColor1;
    }
    if (item.topFillColor2 !== undefined) {
        res.topFillColor2 = item.topFillColor2;
    }
    if (item.bottomFillColor1 !== undefined) {
        res.bottomFillColor1 = item.bottomFillColor1;
    }
    if (item.bottomFillColor2 !== undefined) {
        res.bottomFillColor2 = item.bottomFillColor2;
    }
    return res;
}
function getBarSeriesPlotRow(time, index, item, originalTime) {
    const res = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };
    if (item.color !== undefined) {
        res.color = item.color;
    }
    return res;
}
function getCandlestickSeriesPlotRow(time, index, item, originalTime) {
    const res = { index, time, value: [item.open, item.high, item.low, item.close], originalTime };
    if (item.color !== undefined) {
        res.color = item.color;
    }
    if (item.borderColor !== undefined) {
        res.borderColor = item.borderColor;
    }
    if (item.wickColor !== undefined) {
        res.wickColor = item.wickColor;
    }
    return res;
}
function getCustomSeriesPlotRow(time, index, item, originalTime, dataToPlotRow) {
    const values = (0, assertions_1.ensureDefined)(dataToPlotRow)(item);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const last = values[values.length - 1];
    const value = [last, max, min, last];
    const _a = item, { time: excludedTime, color } = _a, data = tslib_1.__rest(_a, ["time", "color"]);
    return { index, time, value, originalTime, data, color };
}
function isSeriesPlotRow(row) {
    return row.value !== undefined;
}
exports.isSeriesPlotRow = isSeriesPlotRow;
function wrapCustomValues(plotRow, bar) {
    if (bar.customValues !== undefined) {
        plotRow.customValues = bar.customValues;
    }
    return plotRow;
}
function isWhitespaceDataWithCustomCheck(bar, customIsWhitespace) {
    if (customIsWhitespace) {
        return customIsWhitespace(bar);
    }
    return (0, data_consumer_1.isWhitespaceData)(bar);
}
function wrapWhitespaceData(createPlotRowFn) {
    return (time, index, bar, originalTime, dataToPlotRow, customIsWhitespace) => {
        if (isWhitespaceDataWithCustomCheck(bar, customIsWhitespace)) {
            return wrapCustomValues({ time, index, originalTime }, bar);
        }
        return wrapCustomValues(createPlotRowFn(time, index, bar, originalTime, dataToPlotRow), bar);
    };
}
function getSeriesPlotRowCreator(seriesType) {
    const seriesPlotRowFnMap = {
        Candlestick: wrapWhitespaceData(getCandlestickSeriesPlotRow),
        Bar: wrapWhitespaceData(getBarSeriesPlotRow),
        Area: wrapWhitespaceData(getAreaSeriesPlotRow),
        Baseline: wrapWhitespaceData(getBaselineSeriesPlotRow),
        Histogram: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
        Line: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
        Custom: wrapWhitespaceData(getCustomSeriesPlotRow),
    };
    return seriesPlotRowFnMap[seriesType];
}
exports.getSeriesPlotRowCreator = getSeriesPlotRowCreator;
