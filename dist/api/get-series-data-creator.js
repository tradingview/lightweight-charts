function singleValueData(plotRow) {
    const data = {
        value: plotRow.value[3 /* PlotRowValueIndex.Close */],
        time: plotRow.originalTime,
    };
    if (plotRow.customValues !== undefined) {
        data.customValues = plotRow.customValues;
    }
    return data;
}
function lineData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow.color !== undefined) {
        result.color = plotRow.color;
    }
    return result;
}
function areaData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow.lineColor !== undefined) {
        result.lineColor = plotRow.lineColor;
    }
    if (plotRow.topColor !== undefined) {
        result.topColor = plotRow.topColor;
    }
    if (plotRow.bottomColor !== undefined) {
        result.bottomColor = plotRow.bottomColor;
    }
    return result;
}
function baselineData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow.topLineColor !== undefined) {
        result.topLineColor = plotRow.topLineColor;
    }
    if (plotRow.bottomLineColor !== undefined) {
        result.bottomLineColor = plotRow.bottomLineColor;
    }
    if (plotRow.topFillColor1 !== undefined) {
        result.topFillColor1 = plotRow.topFillColor1;
    }
    if (plotRow.topFillColor2 !== undefined) {
        result.topFillColor2 = plotRow.topFillColor2;
    }
    if (plotRow.bottomFillColor1 !== undefined) {
        result.bottomFillColor1 = plotRow.bottomFillColor1;
    }
    if (plotRow.bottomFillColor2 !== undefined) {
        result.bottomFillColor2 = plotRow.bottomFillColor2;
    }
    return result;
}
function ohlcData(plotRow) {
    const data = {
        open: plotRow.value[0 /* PlotRowValueIndex.Open */],
        high: plotRow.value[1 /* PlotRowValueIndex.High */],
        low: plotRow.value[2 /* PlotRowValueIndex.Low */],
        close: plotRow.value[3 /* PlotRowValueIndex.Close */],
        time: plotRow.originalTime,
    };
    if (plotRow.customValues !== undefined) {
        data.customValues = plotRow.customValues;
    }
    return data;
}
function barData(plotRow) {
    const result = ohlcData(plotRow);
    if (plotRow.color !== undefined) {
        result.color = plotRow.color;
    }
    return result;
}
function candlestickData(plotRow) {
    const result = ohlcData(plotRow);
    const { color, borderColor, wickColor } = plotRow;
    if (color !== undefined) {
        result.color = color;
    }
    if (borderColor !== undefined) {
        result.borderColor = borderColor;
    }
    if (wickColor !== undefined) {
        result.wickColor = wickColor;
    }
    return result;
}
export function getSeriesDataCreator(seriesType) {
    const seriesPlotRowToDataMap = {
        Area: (areaData),
        Line: (lineData),
        Baseline: (baselineData),
        Histogram: (lineData),
        Bar: (barData),
        Candlestick: (candlestickData),
        Custom: (customData),
    };
    return seriesPlotRowToDataMap[seriesType];
}
function customData(plotRow) {
    const time = plotRow.originalTime;
    return Object.assign(Object.assign({}, plotRow.data), { time });
}
