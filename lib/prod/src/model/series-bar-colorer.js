import { ensure, ensureNotNull } from '../helpers/assertions';
const barStyleFnMap = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Bar: (findBar, barStyle, barIndex, precomputedBars) => {
        var _a;
        const upColor = barStyle.upColor;
        const downColor = barStyle.downColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar._internal_value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar._internal_value[3 /* PlotRowValueIndex.Close */]);
        return {
            _internal_barColor: (_a = currentBar._internal_color) !== null && _a !== void 0 ? _a : (isUp ? upColor : downColor),
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
        const isUp = ensure(currentBar._internal_value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar._internal_value[3 /* PlotRowValueIndex.Close */]);
        return {
            _internal_barColor: (_a = currentBar._internal_color) !== null && _a !== void 0 ? _a : (isUp ? upColor : downColor),
            _internal_barBorderColor: (_b = currentBar._internal_borderColor) !== null && _b !== void 0 ? _b : (isUp ? borderUpColor : borderDownColor),
            _internal_barWickColor: (_c = currentBar._internal_wickColor) !== null && _c !== void 0 ? _c : (isUp ? wickUpColor : wickDownColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Custom: (findBar, customStyle, barIndex, precomputedBars) => {
        var _a;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: (_a = currentBar._internal_color) !== null && _a !== void 0 ? _a : customStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Area: (findBar, areaStyle, barIndex, precomputedBars) => {
        var _a, _b, _c, _d;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: (_a = currentBar._internal_lineColor) !== null && _a !== void 0 ? _a : areaStyle.lineColor,
            _internal_lineColor: (_b = currentBar._internal_lineColor) !== null && _b !== void 0 ? _b : areaStyle.lineColor,
            _internal_topColor: (_c = currentBar._internal_topColor) !== null && _c !== void 0 ? _c : areaStyle.topColor,
            _internal_bottomColor: (_d = currentBar._internal_bottomColor) !== null && _d !== void 0 ? _d : areaStyle.bottomColor,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Baseline: (findBar, baselineStyle, barIndex, precomputedBars) => {
        var _a, _b, _c, _d, _e, _f;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isAboveBaseline = currentBar._internal_value[3 /* PlotRowValueIndex.Close */] >= baselineStyle.baseValue.price;
        return {
            _internal_barColor: isAboveBaseline ? baselineStyle.topLineColor : baselineStyle.bottomLineColor,
            _internal_topLineColor: (_a = currentBar._internal_topLineColor) !== null && _a !== void 0 ? _a : baselineStyle.topLineColor,
            _internal_bottomLineColor: (_b = currentBar._internal_bottomLineColor) !== null && _b !== void 0 ? _b : baselineStyle.bottomLineColor,
            _internal_topFillColor1: (_c = currentBar._internal_topFillColor1) !== null && _c !== void 0 ? _c : baselineStyle.topFillColor1,
            _internal_topFillColor2: (_d = currentBar._internal_topFillColor2) !== null && _d !== void 0 ? _d : baselineStyle.topFillColor2,
            _internal_bottomFillColor1: (_e = currentBar._internal_bottomFillColor1) !== null && _e !== void 0 ? _e : baselineStyle.bottomFillColor1,
            _internal_bottomFillColor2: (_f = currentBar._internal_bottomFillColor2) !== null && _f !== void 0 ? _f : baselineStyle.bottomFillColor2,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Line: (findBar, lineStyle, barIndex, precomputedBars) => {
        var _a, _b;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: (_a = currentBar._internal_color) !== null && _a !== void 0 ? _a : lineStyle.color,
            _internal_lineColor: (_b = currentBar._internal_color) !== null && _b !== void 0 ? _b : lineStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Histogram: (findBar, histogramStyle, barIndex, precomputedBars) => {
        var _a;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: (_a = currentBar._internal_color) !== null && _a !== void 0 ? _a : histogramStyle.color,
        };
    },
};
export class SeriesBarColorer {
    constructor(series) {
        this._private__findBar = (barIndex, precomputedBars) => {
            if (precomputedBars !== undefined) {
                return precomputedBars._internal_value;
            }
            return this._private__series._internal_bars()._internal_valueAt(barIndex);
        };
        this._private__series = series;
        this._private__styleGetter = barStyleFnMap[series._internal_seriesType()];
    }
    _internal_barStyle(barIndex, precomputedBars) {
        // precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
        // Used to avoid binary search if bars are already known
        return this._private__styleGetter(this._private__findBar, this._private__series._internal_options(), barIndex, precomputedBars);
    }
}
