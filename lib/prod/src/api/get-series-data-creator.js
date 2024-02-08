function singleValueData(plotRow) {
    const data = {
        value: plotRow._internal_value[3 /* PlotRowValueIndex.Close */],
        time: plotRow._internal_originalTime,
    };
    if (plotRow._internal_customValues !== undefined) {
        data.customValues = plotRow._internal_customValues;
    }
    return data;
}
function lineData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow._internal_color !== undefined) {
        result.color = plotRow._internal_color;
    }
    return result;
}
function areaData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow._internal_lineColor !== undefined) {
        result.lineColor = plotRow._internal_lineColor;
    }
    if (plotRow._internal_topColor !== undefined) {
        result.topColor = plotRow._internal_topColor;
    }
    if (plotRow._internal_bottomColor !== undefined) {
        result.bottomColor = plotRow._internal_bottomColor;
    }
    return result;
}
function baselineData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow._internal_topLineColor !== undefined) {
        result.topLineColor = plotRow._internal_topLineColor;
    }
    if (plotRow._internal_bottomLineColor !== undefined) {
        result.bottomLineColor = plotRow._internal_bottomLineColor;
    }
    if (plotRow._internal_topFillColor1 !== undefined) {
        result.topFillColor1 = plotRow._internal_topFillColor1;
    }
    if (plotRow._internal_topFillColor2 !== undefined) {
        result.topFillColor2 = plotRow._internal_topFillColor2;
    }
    if (plotRow._internal_bottomFillColor1 !== undefined) {
        result.bottomFillColor1 = plotRow._internal_bottomFillColor1;
    }
    if (plotRow._internal_bottomFillColor2 !== undefined) {
        result.bottomFillColor2 = plotRow._internal_bottomFillColor2;
    }
    return result;
}
function ohlcData(plotRow) {
    const data = {
        open: plotRow._internal_value[0 /* PlotRowValueIndex.Open */],
        high: plotRow._internal_value[1 /* PlotRowValueIndex.High */],
        low: plotRow._internal_value[2 /* PlotRowValueIndex.Low */],
        close: plotRow._internal_value[3 /* PlotRowValueIndex.Close */],
        time: plotRow._internal_originalTime,
    };
    if (plotRow._internal_customValues !== undefined) {
        data.customValues = plotRow._internal_customValues;
    }
    return data;
}
function barData(plotRow) {
    const result = ohlcData(plotRow);
    if (plotRow._internal_color !== undefined) {
        result.color = plotRow._internal_color;
    }
    return result;
}
function candlestickData(plotRow) {
    const result = ohlcData(plotRow);
    const { _internal_color: color, _internal_borderColor: borderColor, _internal_wickColor: wickColor } = plotRow;
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
    const time = plotRow._internal_originalTime;
    return Object.assign(Object.assign({}, plotRow._internal_data), { time });
}
