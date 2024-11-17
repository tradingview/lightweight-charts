import { ensure, ensureNotNull } from '../helpers/assertions';
const barStyleFnMap = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Bar: (findBar, barStyle, barIndex, precomputedBars) => {
        var _a;
        const upColor = barStyle.upColor;
        const downColor = barStyle.downColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar.value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar.value[3 /* PlotRowValueIndex.Close */]);
        return {
            barColor: (_a = currentBar.color) !== null && _a !== void 0 ? _a : (isUp ? upColor : downColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Candlestick: (findBar, candlestickStyle, barIndex, precomputedBars) => {
        var _a, _b, _c;
        const upColor = candlestickStyle.upColor;
        const downColor = candlestickStyle.downColor;
        const borderUpColor = candlestickStyle.borderUpColor;
        const borderDownColor = candlestickStyle.borderDownColor;
        const wickUpColor = candlestickStyle.wickUpColor;
        const wickDownColor = candlestickStyle.wickDownColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar.value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar.value[3 /* PlotRowValueIndex.Close */]);
        return {
            barColor: (_a = currentBar.color) !== null && _a !== void 0 ? _a : (isUp ? upColor : downColor),
            barBorderColor: (_b = currentBar.borderColor) !== null && _b !== void 0 ? _b : (isUp ? borderUpColor : borderDownColor),
            barWickColor: (_c = currentBar.wickColor) !== null && _c !== void 0 ? _c : (isUp ? wickUpColor : wickDownColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Custom: (findBar, customStyle, barIndex, precomputedBars) => {
        var _a;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: (_a = currentBar.color) !== null && _a !== void 0 ? _a : customStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Area: (findBar, areaStyle, barIndex, precomputedBars) => {
        var _a, _b, _c, _d;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: (_a = currentBar.lineColor) !== null && _a !== void 0 ? _a : areaStyle.lineColor,
            lineColor: (_b = currentBar.lineColor) !== null && _b !== void 0 ? _b : areaStyle.lineColor,
            topColor: (_c = currentBar.topColor) !== null && _c !== void 0 ? _c : areaStyle.topColor,
            bottomColor: (_d = currentBar.bottomColor) !== null && _d !== void 0 ? _d : areaStyle.bottomColor,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Baseline: (findBar, baselineStyle, barIndex, precomputedBars) => {
        var _a, _b, _c, _d, _e, _f;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isAboveBaseline = currentBar.value[3 /* PlotRowValueIndex.Close */] >= baselineStyle.baseValue.price;
        return {
            barColor: isAboveBaseline ? baselineStyle.topLineColor : baselineStyle.bottomLineColor,
            topLineColor: (_a = currentBar.topLineColor) !== null && _a !== void 0 ? _a : baselineStyle.topLineColor,
            bottomLineColor: (_b = currentBar.bottomLineColor) !== null && _b !== void 0 ? _b : baselineStyle.bottomLineColor,
            topFillColor1: (_c = currentBar.topFillColor1) !== null && _c !== void 0 ? _c : baselineStyle.topFillColor1,
            topFillColor2: (_d = currentBar.topFillColor2) !== null && _d !== void 0 ? _d : baselineStyle.topFillColor2,
            bottomFillColor1: (_e = currentBar.bottomFillColor1) !== null && _e !== void 0 ? _e : baselineStyle.bottomFillColor1,
            bottomFillColor2: (_f = currentBar.bottomFillColor2) !== null && _f !== void 0 ? _f : baselineStyle.bottomFillColor2,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Line: (findBar, lineStyle, barIndex, precomputedBars) => {
        var _a, _b;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: (_a = currentBar.color) !== null && _a !== void 0 ? _a : lineStyle.color,
            lineColor: (_b = currentBar.color) !== null && _b !== void 0 ? _b : lineStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Histogram: (findBar, histogramStyle, barIndex, precomputedBars) => {
        var _a;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: (_a = currentBar.color) !== null && _a !== void 0 ? _a : histogramStyle.color,
        };
    },
};
export class SeriesBarColorer {
    constructor(series) {
        this._findBar = (barIndex, precomputedBars) => {
            if (precomputedBars !== undefined) {
                return precomputedBars.value;
            }
            return this._series.bars().valueAt(barIndex);
        };
        this._series = series;
        this._styleGetter = barStyleFnMap[series.seriesType()];
    }
    barStyle(barIndex, precomputedBars) {
        // precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
        // Used to avoid binary search if bars are already known
        return this._styleGetter(this._findBar, this._series.options(), barIndex, precomputedBars);
    }
}
