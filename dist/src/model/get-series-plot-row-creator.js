var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { ensureDefined } from '../helpers/assertions';
import { isWhitespaceData } from './data-consumer';
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
    const values = ensureDefined(dataToPlotRow)(item);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const last = values[values.length - 1];
    const value = [last, max, min, last];
    const _a = item, { time: excludedTime, color } = _a, data = __rest(_a, ["time", "color"]);
    return { index, time, value, originalTime, data, color };
}
export function isSeriesPlotRow(row) {
    return row.value !== undefined;
}
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
    return isWhitespaceData(bar);
}
function wrapWhitespaceData(createPlotRowFn) {
    return (time, index, bar, originalTime, dataToPlotRow, customIsWhitespace) => {
        if (isWhitespaceDataWithCustomCheck(bar, customIsWhitespace)) {
            return wrapCustomValues({ time, index, originalTime }, bar);
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
