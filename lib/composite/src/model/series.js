"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Series = void 0;
const percentage_formatter_1 = require("../formatters/percentage-formatter");
const price_formatter_1 = require("../formatters/price-formatter");
const volume_formatter_1 = require("../formatters/volume-formatter");
const assertions_1 = require("../helpers/assertions");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const area_pane_view_1 = require("../views/pane/area-pane-view");
const bars_pane_view_1 = require("../views/pane/bars-pane-view");
const baseline_pane_view_1 = require("../views/pane/baseline-pane-view");
const candlesticks_pane_view_1 = require("../views/pane/candlesticks-pane-view");
const custom_pane_view_1 = require("../views/pane/custom-pane-view");
const histogram_pane_view_1 = require("../views/pane/histogram-pane-view");
const line_pane_view_1 = require("../views/pane/line-pane-view");
const pane_price_axis_view_1 = require("../views/pane/pane-price-axis-view");
const series_horizontal_base_line_pane_view_1 = require("../views/pane/series-horizontal-base-line-pane-view");
const series_last_price_animation_pane_view_1 = require("../views/pane/series-last-price-animation-pane-view");
const series_markers_pane_view_1 = require("../views/pane/series-markers-pane-view");
const series_price_line_pane_view_1 = require("../views/pane/series-price-line-pane-view");
const series_price_axis_view_1 = require("../views/price-axis/series-price-axis-view");
const autoscale_info_impl_1 = require("./autoscale-info-impl");
const custom_price_line_1 = require("./custom-price-line");
const default_price_scale_1 = require("./default-price-scale");
const price_data_source_1 = require("./price-data-source");
const price_range_impl_1 = require("./price-range-impl");
const series_bar_colorer_1 = require("./series-bar-colorer");
const series_data_1 = require("./series-data");
const series_primitive_wrapper_1 = require("./series-primitive-wrapper");
function extractPrimitivePaneViews(primitives, extractor, zOrder, destination) {
    primitives.forEach((wrapper) => {
        extractor(wrapper).forEach((paneView) => {
            if (paneView.zOrder() !== zOrder) {
                return;
            }
            destination.push(paneView);
        });
    });
}
function primitivePaneViewsExtractor(wrapper) {
    return wrapper.paneViews();
}
function primitivePricePaneViewsExtractor(wrapper) {
    return wrapper.priceAxisPaneViews();
}
function primitiveTimePaneViewsExtractor(wrapper) {
    return wrapper.timeAxisPaneViews();
}
class Series extends price_data_source_1.PriceDataSource {
    constructor(model, options, seriesType, pane, customPaneView) {
        super(model);
        this._data = (0, series_data_1.createSeriesPlotList)();
        this._priceLineView = new series_price_line_pane_view_1.SeriesPriceLinePaneView(this);
        this._customPriceLines = [];
        this._baseHorizontalLineView = new series_horizontal_base_line_pane_view_1.SeriesHorizontalBaseLinePaneView(this);
        this._lastPriceAnimationPaneView = null;
        this._barColorerCache = null;
        this._markers = [];
        this._indexedMarkers = [];
        this._animationTimeoutId = null;
        this._primitives = [];
        this._options = options;
        this._seriesType = seriesType;
        const priceAxisView = new series_price_axis_view_1.SeriesPriceAxisView(this);
        this._priceAxisViews = [priceAxisView];
        this._panePriceAxisView = new pane_price_axis_view_1.PanePriceAxisView(priceAxisView, this, model);
        if (seriesType === 'Area' || seriesType === 'Line' || seriesType === 'Baseline') {
            this._lastPriceAnimationPaneView = new series_last_price_animation_pane_view_1.SeriesLastPriceAnimationPaneView(this);
        }
        this._recreateFormatter();
        this._recreatePaneViews(customPaneView);
    }
    destroy() {
        if (this._animationTimeoutId !== null) {
            clearTimeout(this._animationTimeoutId);
        }
    }
    priceLineColor(lastBarColor) {
        return this._options.priceLineColor || lastBarColor;
    }
    lastValueData(globalLast) {
        const noDataRes = { noData: true };
        const priceScale = this.priceScale();
        if (this.model().timeScale().isEmpty() || priceScale.isEmpty() || this._data.isEmpty()) {
            return noDataRes;
        }
        const visibleBars = this.model().timeScale().visibleStrictRange();
        const firstValue = this.firstValue();
        if (visibleBars === null || firstValue === null) {
            return noDataRes;
        }
        // find range of bars inside range
        // TODO: make it more optimal
        let bar;
        let lastIndex;
        if (globalLast) {
            const lastBar = this._data.last();
            if (lastBar === null) {
                return noDataRes;
            }
            bar = lastBar;
            lastIndex = lastBar.index;
        }
        else {
            const endBar = this._data.search(visibleBars.right(), -1 /* MismatchDirection.NearestLeft */);
            if (endBar === null) {
                return noDataRes;
            }
            bar = this._data.valueAt(endBar.index);
            if (bar === null) {
                return noDataRes;
            }
            lastIndex = endBar.index;
        }
        const price = bar.value[3 /* PlotRowValueIndex.Close */];
        const barColorer = this.barColorer();
        const style = barColorer.barStyle(lastIndex, { value: bar });
        const coordinate = priceScale.priceToCoordinate(price, firstValue.value);
        return {
            noData: false,
            price,
            text: priceScale.formatPrice(price, firstValue.value),
            formattedPriceAbsolute: priceScale.formatPriceAbsolute(price),
            formattedPricePercentage: priceScale.formatPricePercentage(price, firstValue.value),
            color: style.barColor,
            coordinate: coordinate,
            index: lastIndex,
        };
    }
    barColorer() {
        if (this._barColorerCache !== null) {
            return this._barColorerCache;
        }
        this._barColorerCache = new series_bar_colorer_1.SeriesBarColorer(this);
        return this._barColorerCache;
    }
    options() {
        return this._options;
    }
    applyOptions(options) {
        const targetPriceScaleId = options.priceScaleId;
        if (targetPriceScaleId !== undefined && targetPriceScaleId !== this._options.priceScaleId) {
            // series cannot do it itself, ask model
            this.model().moveSeriesToScale(this, targetPriceScaleId);
        }
        (0, strict_type_checks_1.merge)(this._options, options);
        if (options.priceFormat !== undefined) {
            this._recreateFormatter();
            // updated formatter might affect rendering  and as a consequence of this the width of price axis might be changed
            // thus we need to force the chart to do a full update to apply changes correctly
            // full update is quite heavy operation in terms of performance
            // but updating formatter looks like quite rare so forcing a full update here shouldn't affect the performance a lot
            this.model().fullUpdate();
        }
        this.model().updateSource(this);
        // a series might affect crosshair by some options (like crosshair markers)
        // that's why we need to update crosshair as well
        this.model().updateCrosshair();
        this._paneView.update('options');
    }
    setData(data, updateInfo) {
        this._data.setData(data);
        this._recalculateMarkers();
        this._paneView.update('data');
        this._markersPaneView.update('data');
        if (this._lastPriceAnimationPaneView !== null) {
            if (updateInfo && updateInfo.lastBarUpdatedOrNewBarsAddedToTheRight) {
                this._lastPriceAnimationPaneView.onNewRealtimeDataReceived();
            }
            else if (data.length === 0) {
                this._lastPriceAnimationPaneView.onDataCleared();
            }
        }
        const sourcePane = this.model().paneForSource(this);
        this.model().recalculatePane(sourcePane);
        this.model().updateSource(this);
        this.model().updateCrosshair();
        this.model().lightUpdate();
    }
    setMarkers(data) {
        this._markers = data;
        this._recalculateMarkers();
        const sourcePane = this.model().paneForSource(this);
        this._markersPaneView.update('data');
        this.model().recalculatePane(sourcePane);
        this.model().updateSource(this);
        this.model().updateCrosshair();
        this.model().lightUpdate();
    }
    markers() {
        return this._markers;
    }
    indexedMarkers() {
        return this._indexedMarkers;
    }
    createPriceLine(options) {
        const result = new custom_price_line_1.CustomPriceLine(this, options);
        this._customPriceLines.push(result);
        this.model().updateSource(this);
        return result;
    }
    removePriceLine(line) {
        const index = this._customPriceLines.indexOf(line);
        if (index !== -1) {
            this._customPriceLines.splice(index, 1);
        }
        this.model().updateSource(this);
    }
    seriesType() {
        return this._seriesType;
    }
    firstValue() {
        const bar = this.firstBar();
        if (bar === null) {
            return null;
        }
        return {
            value: bar.value[3 /* PlotRowValueIndex.Close */],
            timePoint: bar.time,
        };
    }
    firstBar() {
        const visibleBars = this.model().timeScale().visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        const startTimePoint = visibleBars.left();
        return this._data.search(startTimePoint, 1 /* MismatchDirection.NearestRight */);
    }
    bars() {
        return this._data;
    }
    dataAt(time) {
        const prices = this._data.valueAt(time);
        if (prices === null) {
            return null;
        }
        if (this._seriesType === 'Bar' || this._seriesType === 'Candlestick' || this._seriesType === 'Custom') {
            return {
                open: prices.value[0 /* PlotRowValueIndex.Open */],
                high: prices.value[1 /* PlotRowValueIndex.High */],
                low: prices.value[2 /* PlotRowValueIndex.Low */],
                close: prices.value[3 /* PlotRowValueIndex.Close */],
            };
        }
        else {
            return prices.value[3 /* PlotRowValueIndex.Close */];
        }
    }
    topPaneViews(pane) {
        const res = [];
        extractPrimitivePaneViews(this._primitives, primitivePaneViewsExtractor, 'top', res);
        const animationPaneView = this._lastPriceAnimationPaneView;
        if (animationPaneView === null || !animationPaneView.visible()) {
            return res;
        }
        if (this._animationTimeoutId === null && animationPaneView.animationActive()) {
            this._animationTimeoutId = setTimeout(() => {
                this._animationTimeoutId = null;
                this.model().cursorUpdate();
            }, 0);
        }
        animationPaneView.invalidateStage();
        res.push(animationPaneView);
        return res;
    }
    paneViews() {
        const res = [];
        if (!this._isOverlay()) {
            res.push(this._baseHorizontalLineView);
        }
        res.push(this._paneView, this._priceLineView, this._markersPaneView);
        const priceLineViews = this._customPriceLines.map((line) => line.paneView());
        res.push(...priceLineViews);
        extractPrimitivePaneViews(this._primitives, primitivePaneViewsExtractor, 'normal', res);
        return res;
    }
    bottomPaneViews() {
        return this._extractPaneViews(primitivePaneViewsExtractor, 'bottom');
    }
    pricePaneViews(zOrder) {
        return this._extractPaneViews(primitivePricePaneViewsExtractor, zOrder);
    }
    timePaneViews(zOrder) {
        return this._extractPaneViews(primitiveTimePaneViewsExtractor, zOrder);
    }
    primitiveHitTest(x, y) {
        return this._primitives
            .map((primitive) => primitive.hitTest(x, y))
            .filter((result) => result !== null);
    }
    labelPaneViews(pane) {
        return [
            this._panePriceAxisView,
            ...this._customPriceLines.map((line) => line.labelPaneView()),
        ];
    }
    priceAxisViews(pane, priceScale) {
        if (priceScale !== this._priceScale && !this._isOverlay()) {
            return [];
        }
        const result = [...this._priceAxisViews];
        for (const customPriceLine of this._customPriceLines) {
            result.push(customPriceLine.priceAxisView());
        }
        this._primitives.forEach((wrapper) => {
            result.push(...wrapper.priceAxisViews());
        });
        return result;
    }
    timeAxisViews() {
        const res = [];
        this._primitives.forEach((wrapper) => {
            res.push(...wrapper.timeAxisViews());
        });
        return res;
    }
    autoscaleInfo(startTimePoint, endTimePoint) {
        if (this._options.autoscaleInfoProvider !== undefined) {
            const autoscaleInfo = this._options.autoscaleInfoProvider(() => {
                const res = this._autoscaleInfoImpl(startTimePoint, endTimePoint);
                return (res === null) ? null : res.toRaw();
            });
            return autoscale_info_impl_1.AutoscaleInfoImpl.fromRaw(autoscaleInfo);
        }
        return this._autoscaleInfoImpl(startTimePoint, endTimePoint);
    }
    minMove() {
        return this._options.priceFormat.minMove;
    }
    formatter() {
        return this._formatter;
    }
    updateAllViews() {
        var _a;
        this._paneView.update();
        this._markersPaneView.update();
        for (const priceAxisView of this._priceAxisViews) {
            priceAxisView.update();
        }
        for (const customPriceLine of this._customPriceLines) {
            customPriceLine.update();
        }
        this._priceLineView.update();
        this._baseHorizontalLineView.update();
        (_a = this._lastPriceAnimationPaneView) === null || _a === void 0 ? void 0 : _a.update();
        this._primitives.forEach((wrapper) => wrapper.updateAllViews());
    }
    priceScale() {
        return (0, assertions_1.ensureNotNull)(super.priceScale());
    }
    markerDataAtIndex(index) {
        const getValue = (this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Baseline') &&
            this._options.crosshairMarkerVisible;
        if (!getValue) {
            return null;
        }
        const bar = this._data.valueAt(index);
        if (bar === null) {
            return null;
        }
        const price = bar.value[3 /* PlotRowValueIndex.Close */];
        const radius = this._markerRadius();
        const borderColor = this._markerBorderColor();
        const borderWidth = this._markerBorderWidth();
        const backgroundColor = this._markerBackgroundColor(index);
        return { price, radius, borderColor, borderWidth, backgroundColor };
    }
    title() {
        return this._options.title;
    }
    visible() {
        return this._options.visible;
    }
    attachPrimitive(primitive) {
        this._primitives.push(new series_primitive_wrapper_1.SeriesPrimitiveWrapper(primitive, this));
    }
    detachPrimitive(source) {
        this._primitives = this._primitives.filter((wrapper) => wrapper.primitive() !== source);
    }
    customSeriesPlotValuesBuilder() {
        if (this._paneView instanceof custom_pane_view_1.SeriesCustomPaneView === false) {
            return undefined;
        }
        return (data) => {
            return this._paneView.priceValueBuilder(data);
        };
    }
    customSeriesWhitespaceCheck() {
        if (this._paneView instanceof custom_pane_view_1.SeriesCustomPaneView === false) {
            return undefined;
        }
        return (data) => {
            return this._paneView.isWhitespace(data);
        };
    }
    _isOverlay() {
        const priceScale = this.priceScale();
        return !(0, default_price_scale_1.isDefaultPriceScale)(priceScale.id());
    }
    _autoscaleInfoImpl(startTimePoint, endTimePoint) {
        if (!(0, strict_type_checks_1.isInteger)(startTimePoint) || !(0, strict_type_checks_1.isInteger)(endTimePoint) || this._data.isEmpty()) {
            return null;
        }
        // TODO: refactor this
        // series data is strongly hardcoded to keep bars
        const plots = this._seriesType === 'Line' || this._seriesType === 'Area' || this._seriesType === 'Baseline' || this._seriesType === 'Histogram'
            ? [3 /* PlotRowValueIndex.Close */]
            : [2 /* PlotRowValueIndex.Low */, 1 /* PlotRowValueIndex.High */];
        const barsMinMax = this._data.minMaxOnRangeCached(startTimePoint, endTimePoint, plots);
        let range = barsMinMax !== null ? new price_range_impl_1.PriceRangeImpl(barsMinMax.min, barsMinMax.max) : null;
        if (this.seriesType() === 'Histogram') {
            const base = this._options.base;
            const rangeWithBase = new price_range_impl_1.PriceRangeImpl(base, base);
            range = range !== null ? range.merge(rangeWithBase) : rangeWithBase;
        }
        let margins = this._markersPaneView.autoScaleMargins();
        this._primitives.forEach((primitive) => {
            const primitiveAutoscale = primitive.autoscaleInfo(startTimePoint, endTimePoint);
            if (primitiveAutoscale === null || primitiveAutoscale === void 0 ? void 0 : primitiveAutoscale.priceRange) {
                const primitiveRange = new price_range_impl_1.PriceRangeImpl(primitiveAutoscale.priceRange.minValue, primitiveAutoscale.priceRange.maxValue);
                range = range !== null ? range.merge(primitiveRange) : primitiveRange;
            }
            if (primitiveAutoscale === null || primitiveAutoscale === void 0 ? void 0 : primitiveAutoscale.margins) {
                margins = mergeMargins(margins, primitiveAutoscale.margins);
            }
        });
        return new autoscale_info_impl_1.AutoscaleInfoImpl(range, margins);
    }
    _markerRadius() {
        switch (this._seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline':
                return this._options.crosshairMarkerRadius;
        }
        return 0;
    }
    _markerBorderColor() {
        switch (this._seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline': {
                const crosshairMarkerBorderColor = this._options.crosshairMarkerBorderColor;
                if (crosshairMarkerBorderColor.length !== 0) {
                    return crosshairMarkerBorderColor;
                }
            }
        }
        return null;
    }
    _markerBorderWidth() {
        switch (this._seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline':
                return this._options.crosshairMarkerBorderWidth;
        }
        return 0;
    }
    _markerBackgroundColor(index) {
        switch (this._seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline': {
                const crosshairMarkerBackgroundColor = this._options.crosshairMarkerBackgroundColor;
                if (crosshairMarkerBackgroundColor.length !== 0) {
                    return crosshairMarkerBackgroundColor;
                }
            }
        }
        return this.barColorer().barStyle(index).barColor;
    }
    _recreateFormatter() {
        switch (this._options.priceFormat.type) {
            case 'custom': {
                this._formatter = { format: this._options.priceFormat.formatter };
                break;
            }
            case 'volume': {
                this._formatter = new volume_formatter_1.VolumeFormatter(this._options.priceFormat.precision);
                break;
            }
            case 'percent': {
                this._formatter = new percentage_formatter_1.PercentageFormatter(this._options.priceFormat.precision);
                break;
            }
            default: {
                const priceScale = Math.pow(10, this._options.priceFormat.precision);
                this._formatter = new price_formatter_1.PriceFormatter(priceScale, this._options.priceFormat.minMove * priceScale);
            }
        }
        if (this._priceScale !== null) {
            this._priceScale.updateFormatter();
        }
    }
    _recalculateMarkers() {
        const timeScale = this.model().timeScale();
        if (!timeScale.hasPoints() || this._data.isEmpty()) {
            this._indexedMarkers = [];
            return;
        }
        const firstDataIndex = (0, assertions_1.ensureNotNull)(this._data.firstIndex());
        this._indexedMarkers = this._markers.map((marker, index) => {
            // the first find index on the time scale (across all series)
            const timePointIndex = (0, assertions_1.ensureNotNull)(timeScale.timeToIndex(marker.time, true));
            // and then search that index inside the series data
            const searchMode = timePointIndex < firstDataIndex ? 1 /* MismatchDirection.NearestRight */ : -1 /* MismatchDirection.NearestLeft */;
            const seriesDataIndex = (0, assertions_1.ensureNotNull)(this._data.search(timePointIndex, searchMode)).index;
            return {
                time: seriesDataIndex,
                position: marker.position,
                shape: marker.shape,
                color: marker.color,
                id: marker.id,
                internalId: index,
                text: marker.text,
                size: marker.size,
                originalTime: marker.originalTime,
            };
        });
    }
    _recreatePaneViews(customPaneView) {
        this._markersPaneView = new series_markers_pane_view_1.SeriesMarkersPaneView(this, this.model());
        switch (this._seriesType) {
            case 'Bar': {
                this._paneView = new bars_pane_view_1.SeriesBarsPaneView(this, this.model());
                break;
            }
            case 'Candlestick': {
                this._paneView = new candlesticks_pane_view_1.SeriesCandlesticksPaneView(this, this.model());
                break;
            }
            case 'Line': {
                this._paneView = new line_pane_view_1.SeriesLinePaneView(this, this.model());
                break;
            }
            case 'Custom': {
                this._paneView = new custom_pane_view_1.SeriesCustomPaneView(this, this.model(), (0, assertions_1.ensureDefined)(customPaneView));
                break;
            }
            case 'Area': {
                this._paneView = new area_pane_view_1.SeriesAreaPaneView(this, this.model());
                break;
            }
            case 'Baseline': {
                this._paneView = new baseline_pane_view_1.SeriesBaselinePaneView(this, this.model());
                break;
            }
            case 'Histogram': {
                this._paneView = new histogram_pane_view_1.SeriesHistogramPaneView(this, this.model());
                break;
            }
            default: throw Error('Unknown chart style assigned: ' + this._seriesType);
        }
    }
    _extractPaneViews(extractor, zOrder) {
        const res = [];
        extractPrimitivePaneViews(this._primitives, extractor, zOrder, res);
        return res;
    }
}
exports.Series = Series;
function mergeMargins(source, additionalMargin) {
    var _a, _b;
    return {
        above: Math.max((_a = source === null || source === void 0 ? void 0 : source.above) !== null && _a !== void 0 ? _a : 0, additionalMargin.above),
        below: Math.max((_b = source === null || source === void 0 ? void 0 : source.below) !== null && _b !== void 0 ? _b : 0, additionalMargin.below),
    };
}
