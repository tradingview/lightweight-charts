import { __rest } from "tslib";
import { ensureDefined } from '../helpers/assertions';
import { isWhitespaceData } from './data-consumer';
function getColoredLineBasedSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val], _internal_originalTime: originalTime };
    if (item.color !== undefined) {
        res._internal_color = item.color;
    }
    return res;
}
function getAreaSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val], _internal_originalTime: originalTime };
    if (item.lineColor !== undefined) {
        res._internal_lineColor = item.lineColor;
    }
    if (item.topColor !== undefined) {
        res._internal_topColor = item.topColor;
    }
    if (item.bottomColor !== undefined) {
        res._internal_bottomColor = item.bottomColor;
    }
    return res;
}
function getBaselineSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val], _internal_originalTime: originalTime };
    if (item.topLineColor !== undefined) {
        res._internal_topLineColor = item.topLineColor;
    }
    if (item.bottomLineColor !== undefined) {
        res._internal_bottomLineColor = item.bottomLineColor;
    }
    if (item.topFillColor1 !== undefined) {
        res._internal_topFillColor1 = item.topFillColor1;
    }
    if (item.topFillColor2 !== undefined) {
        res._internal_topFillColor2 = item.topFillColor2;
    }
    if (item.bottomFillColor1 !== undefined) {
        res._internal_bottomFillColor1 = item.bottomFillColor1;
    }
    if (item.bottomFillColor2 !== undefined) {
        res._internal_bottomFillColor2 = item.bottomFillColor2;
    }
    return res;
}
function getBarSeriesPlotRow(time, index, item, originalTime) {
    const res = { _internal_index: index, _internal_time: time, _internal_value: [item.open, item.high, item.low, item.close], _internal_originalTime: originalTime };
    if (item.color !== undefined) {
        res._internal_color = item.color;
    }
    return res;
}
function getCandlestickSeriesPlotRow(time, index, item, originalTime) {
    const res = { _internal_index: index, _internal_time: time, _internal_value: [item.open, item.high, item.low, item.close], _internal_originalTime: originalTime };
    if (item.color !== undefined) {
        res._internal_color = item.color;
    }
    if (item.borderColor !== undefined) {
        res._internal_borderColor = item.borderColor;
    }
    if (item.wickColor !== undefined) {
        res._internal_wickColor = item.wickColor;
    }
    return res;
}
function getCustomSeriesPlotRow(time, index, item, originalTime, dataToPlotRow) {
    const values = ensureDefined(dataToPlotRow)(item);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const last = values[values.length - 1];
    const value = [last, max, min, last];
    const _a = item, { time: excludedTime, color } = _a, data = __rest(_a, ["time", "color"]);
    return { _internal_index: index, _internal_time: time, _internal_value: value, _internal_originalTime: originalTime, _internal_data: data, _internal_color: color };
}
export function isSeriesPlotRow(row) {
    return row._internal_value !== undefined;
}
function wrapCustomValues(plotRow, bar) {
    if (bar.customValues !== undefined) {
        plotRow._internal_customValues = bar.customValues;
    }
    return plotRow;
}
function isWhitespaceDataWithCustomCheck(bar, customIsWhitespace) {
    if (customIsWhitespace) {
        return customIsWhitespace(bar);
    }
    return isWhitespaceData(bar);
}
function wrapWhitespaceData(createPlotRowFn) {
    return (time, index, bar, originalTime, dataToPlotRow, customIsWhitespace) => {
        if (isWhitespaceDataWithCustomCheck(bar, customIsWhitespace)) {
            return wrapCustomValues({ _internal_time: time, _internal_index: index, _internal_originalTime: originalTime }, bar);
        }
        return wrapCustomValues(createPlotRowFn(time, index, bar, originalTime, dataToPlotRow), bar);
    };
}
export function getSeriesPlotRowCreator(seriesType) {
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
