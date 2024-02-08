import { PercentageFormatter } from '../formatters/percentage-formatter';
import { PriceFormatter } from '../formatters/price-formatter';
import { VolumeFormatter } from '../formatters/volume-formatter';
import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { isInteger, merge } from '../helpers/strict-type-checks';
import { SeriesAreaPaneView } from '../views/pane/area-pane-view';
import { SeriesBarsPaneView } from '../views/pane/bars-pane-view';
import { SeriesBaselinePaneView } from '../views/pane/baseline-pane-view';
import { SeriesCandlesticksPaneView } from '../views/pane/candlesticks-pane-view';
import { SeriesCustomPaneView } from '../views/pane/custom-pane-view';
import { SeriesHistogramPaneView } from '../views/pane/histogram-pane-view';
import { SeriesLinePaneView } from '../views/pane/line-pane-view';
import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
import { SeriesHorizontalBaseLinePaneView } from '../views/pane/series-horizontal-base-line-pane-view';
import { SeriesLastPriceAnimationPaneView } from '../views/pane/series-last-price-animation-pane-view';
import { SeriesMarkersPaneView } from '../views/pane/series-markers-pane-view';
import { SeriesPriceLinePaneView } from '../views/pane/series-price-line-pane-view';
import { SeriesPriceAxisView } from '../views/price-axis/series-price-axis-view';
import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { CustomPriceLine } from './custom-price-line';
import { isDefaultPriceScale } from './default-price-scale';
import { PriceDataSource } from './price-data-source';
import { PriceRangeImpl } from './price-range-impl';
import { SeriesBarColorer } from './series-bar-colorer';
import { createSeriesPlotList } from './series-data';
import { SeriesPrimitiveWrapper } from './series-primitive-wrapper';
function extractPrimitivePaneViews(primitives, extractor, zOrder, destination) {
    primitives.forEach((wrapper) => {
        extractor(wrapper).forEach((paneView) => {
            if (paneView._internal_zOrder() !== zOrder) {
                return;
            }
            destination.push(paneView);
        });
    });
}
function primitivePaneViewsExtractor(wrapper) {
    return wrapper._internal_paneViews();
}
function primitivePricePaneViewsExtractor(wrapper) {
    return wrapper._internal_priceAxisPaneViews();
}
function primitiveTimePaneViewsExtractor(wrapper) {
    return wrapper._internal_timeAxisPaneViews();
}
export class Series extends PriceDataSource {
    constructor(model, options, seriesType, pane, customPaneView) {
        super(model);
        this._private__data = createSeriesPlotList();
        this._private__priceLineView = new SeriesPriceLinePaneView(this);
        this._private__customPriceLines = [];
        this._private__baseHorizontalLineView = new SeriesHorizontalBaseLinePaneView(this);
        this._private__lastPriceAnimationPaneView = null;
        this._private__barColorerCache = null;
        this._private__markers = [];
        this._private__indexedMarkers = [];
        this._private__animationTimeoutId = null;
        this._private__primitives = [];
        this._private__options = options;
        this._private__seriesType = seriesType;
        const priceAxisView = new SeriesPriceAxisView(this);
        this._private__priceAxisViews = [priceAxisView];
        this._private__panePriceAxisView = new PanePriceAxisView(priceAxisView, this, model);
        if (seriesType === 'Area' || seriesType === 'Line' || seriesType === 'Baseline') {
            this._private__lastPriceAnimationPaneView = new SeriesLastPriceAnimationPaneView(this);
        }
        this._private__recreateFormatter();
        this._private__recreatePaneViews(customPaneView);
    }
    _internal_destroy() {
        if (this._private__animationTimeoutId !== null) {
            clearTimeout(this._private__animationTimeoutId);
        }
    }
    _internal_priceLineColor(lastBarColor) {
        return this._private__options.priceLineColor || lastBarColor;
    }
    _internal_lastValueData(globalLast) {
        const noDataRes = { _internal_noData: true };
        const priceScale = this._internal_priceScale();
        if (this._internal_model()._internal_timeScale()._internal_isEmpty() || priceScale._internal_isEmpty() || this._private__data._internal_isEmpty()) {
            return noDataRes;
        }
        const visibleBars = this._internal_model()._internal_timeScale()._internal_visibleStrictRange();
        const firstValue = this._internal_firstValue();
        if (visibleBars === null || firstValue === null) {
            return noDataRes;
        }
        // find range of bars inside range
        // TODO: make it more optimal
        let bar;
        let lastIndex;
        if (globalLast) {
            const lastBar = this._private__data._internal_last();
            if (lastBar === null) {
                return noDataRes;
            }
            bar = lastBar;
            lastIndex = lastBar._internal_index;
        }
        else {
            const endBar = this._private__data._internal_search(visibleBars._internal_right(), -1 /* MismatchDirection.NearestLeft */);
            if (endBar === null) {
                return noDataRes;
            }
            bar = this._private__data._internal_valueAt(endBar._internal_index);
            if (bar === null) {
                return noDataRes;
            }
            lastIndex = endBar._internal_index;
        }
        const price = bar._internal_value[3 /* PlotRowValueIndex.Close */];
        const barColorer = this._internal_barColorer();
        const style = barColorer._internal_barStyle(lastIndex, { _internal_value: bar });
        const coordinate = priceScale._internal_priceToCoordinate(price, firstValue._internal_value);
        return {
            _internal_noData: false,
            _internal_price: price,
            _internal_text: priceScale._internal_formatPrice(price, firstValue._internal_value),
            _internal_formattedPriceAbsolute: priceScale._internal_formatPriceAbsolute(price),
            _internal_formattedPricePercentage: priceScale._internal_formatPricePercentage(price, firstValue._internal_value),
            _internal_color: style._internal_barColor,
            _internal_coordinate: coordinate,
            _internal_index: lastIndex,
        };
    }
    _internal_barColorer() {
        if (this._private__barColorerCache !== null) {
            return this._private__barColorerCache;
        }
        this._private__barColorerCache = new SeriesBarColorer(this);
        return this._private__barColorerCache;
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_applyOptions(options) {
        const targetPriceScaleId = options.priceScaleId;
        if (targetPriceScaleId !== undefined && targetPriceScaleId !== this._private__options.priceScaleId) {
            // series cannot do it itself, ask model
            this._internal_model()._internal_moveSeriesToScale(this, targetPriceScaleId);
        }
        merge(this._private__options, options);
        if (options.priceFormat !== undefined) {
            this._private__recreateFormatter();
            // updated formatter might affect rendering  and as a consequence of this the width of price axis might be changed
            // thus we need to force the chart to do a full update to apply changes correctly
            // full update is quite heavy operation in terms of performance
            // but updating formatter looks like quite rare so forcing a full update here shouldn't affect the performance a lot
            this._internal_model()._internal_fullUpdate();
        }
        this._internal_model()._internal_updateSource(this);
        // a series might affect crosshair by some options (like crosshair markers)
        // that's why we need to update crosshair as well
        this._internal_model()._internal_updateCrosshair();
        this._private__paneView._internal_update('options');
    }
    _internal_setData(data, updateInfo) {
        this._private__data._internal_setData(data);
        this._private__recalculateMarkers();
        this._private__paneView._internal_update('data');
        this._private__markersPaneView._internal_update('data');
        if (this._private__lastPriceAnimationPaneView !== null) {
            if (updateInfo && updateInfo._internal_lastBarUpdatedOrNewBarsAddedToTheRight) {
                this._private__lastPriceAnimationPaneView._internal_onNewRealtimeDataReceived();
            }
            else if (data.length === 0) {
                this._private__lastPriceAnimationPaneView._internal_onDataCleared();
            }
        }
        const sourcePane = this._internal_model()._internal_paneForSource(this);
        this._internal_model()._internal_recalculatePane(sourcePane);
        this._internal_model()._internal_updateSource(this);
        this._internal_model()._internal_updateCrosshair();
        this._internal_model()._internal_lightUpdate();
    }
    _internal_setMarkers(data) {
        this._private__markers = data;
        this._private__recalculateMarkers();
        const sourcePane = this._internal_model()._internal_paneForSource(this);
        this._private__markersPaneView._internal_update('data');
        this._internal_model()._internal_recalculatePane(sourcePane);
        this._internal_model()._internal_updateSource(this);
        this._internal_model()._internal_updateCrosshair();
        this._internal_model()._internal_lightUpdate();
    }
    _internal_markers() {
        return this._private__markers;
    }
    _internal_indexedMarkers() {
        return this._private__indexedMarkers;
    }
    _internal_createPriceLine(options) {
        const result = new CustomPriceLine(this, options);
        this._private__customPriceLines.push(result);
        this._internal_model()._internal_updateSource(this);
        return result;
    }
    _internal_removePriceLine(line) {
        const index = this._private__customPriceLines.indexOf(line);
        if (index !== -1) {
            this._private__customPriceLines.splice(index, 1);
        }
        this._internal_model()._internal_updateSource(this);
    }
    _internal_seriesType() {
        return this._private__seriesType;
    }
    _internal_firstValue() {
        const bar = this._internal_firstBar();
        if (bar === null) {
            return null;
        }
        return {
            _internal_value: bar._internal_value[3 /* PlotRowValueIndex.Close */],
            _internal_timePoint: bar._internal_time,
        };
    }
    _internal_firstBar() {
        const visibleBars = this._internal_model()._internal_timeScale()._internal_visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        const startTimePoint = visibleBars._internal_left();
        return this._private__data._internal_search(startTimePoint, 1 /* MismatchDirection.NearestRight */);
    }
    _internal_bars() {
        return this._private__data;
    }
    _internal_dataAt(time) {
        const prices = this._private__data._internal_valueAt(time);
        if (prices === null) {
            return null;
        }
        if (this._private__seriesType === 'Bar' || this._private__seriesType === 'Candlestick' || this._private__seriesType === 'Custom') {
            return {
                _internal_open: prices._internal_value[0 /* PlotRowValueIndex.Open */],
                _internal_high: prices._internal_value[1 /* PlotRowValueIndex.High */],
                _internal_low: prices._internal_value[2 /* PlotRowValueIndex.Low */],
                _internal_close: prices._internal_value[3 /* PlotRowValueIndex.Close */],
            };
        }
        else {
            return prices._internal_value[3 /* PlotRowValueIndex.Close */];
        }
    }
    _internal_topPaneViews(pane) {
        const res = [];
        extractPrimitivePaneViews(this._private__primitives, primitivePaneViewsExtractor, 'top', res);
        const animationPaneView = this._private__lastPriceAnimationPaneView;
        if (animationPaneView === null || !animationPaneView._internal_visible()) {
            return res;
        }
        if (this._private__animationTimeoutId === null && animationPaneView._internal_animationActive()) {
            this._private__animationTimeoutId = setTimeout(() => {
                this._private__animationTimeoutId = null;
                this._internal_model()._internal_cursorUpdate();
            }, 0);
        }
        animationPaneView._internal_invalidateStage();
        res.push(animationPaneView);
        return res;
    }
    _internal_paneViews() {
        const res = [];
        if (!this._private__isOverlay()) {
            res.push(this._private__baseHorizontalLineView);
        }
        res.push(this._private__paneView, this._private__priceLineView, this._private__markersPaneView);
        const priceLineViews = this._private__customPriceLines.map((line) => line._internal_paneView());
        res.push(...priceLineViews);
        extractPrimitivePaneViews(this._private__primitives, primitivePaneViewsExtractor, 'normal', res);
        return res;
    }
    _internal_bottomPaneViews() {
        return this._private__extractPaneViews(primitivePaneViewsExtractor, 'bottom');
    }
    _internal_pricePaneViews(zOrder) {
        return this._private__extractPaneViews(primitivePricePaneViewsExtractor, zOrder);
    }
    _internal_timePaneViews(zOrder) {
        return this._private__extractPaneViews(primitiveTimePaneViewsExtractor, zOrder);
    }
    _internal_primitiveHitTest(x, y) {
        return this._private__primitives
            .map((primitive) => primitive._internal_hitTest(x, y))
            .filter((result) => result !== null);
    }
    _internal_labelPaneViews(pane) {
        return [
            this._private__panePriceAxisView,
            ...this._private__customPriceLines.map((line) => line._internal_labelPaneView()),
        ];
    }
    _internal_priceAxisViews(pane, priceScale) {
        if (priceScale !== this._internal__priceScale && !this._private__isOverlay()) {
            return [];
        }
        const result = [...this._private__priceAxisViews];
        for (const customPriceLine of this._private__customPriceLines) {
            result.push(customPriceLine._internal_priceAxisView());
        }
        this._private__primitives.forEach((wrapper) => {
            result.push(...wrapper._internal_priceAxisViews());
        });
        return result;
    }
    _internal_timeAxisViews() {
        const res = [];
        this._private__primitives.forEach((wrapper) => {
            res.push(...wrapper._internal_timeAxisViews());
        });
        return res;
    }
    _internal_autoscaleInfo(startTimePoint, endTimePoint) {
        if (this._private__options.autoscaleInfoProvider !== undefined) {
            const autoscaleInfo = this._private__options.autoscaleInfoProvider(() => {
                const res = this._private__autoscaleInfoImpl(startTimePoint, endTimePoint);
                return (res === null) ? null : res._internal_toRaw();
            });
            return AutoscaleInfoImpl._internal_fromRaw(autoscaleInfo);
        }
        return this._private__autoscaleInfoImpl(startTimePoint, endTimePoint);
    }
    _internal_minMove() {
        return this._private__options.priceFormat.minMove;
    }
    _internal_formatter() {
        return this._private__formatter;
    }
    _internal_updateAllViews() {
        var _a;
        this._private__paneView._internal_update();
        this._private__markersPaneView._internal_update();
        for (const priceAxisView of this._private__priceAxisViews) {
            priceAxisView._internal_update();
        }
        for (const customPriceLine of this._private__customPriceLines) {
            customPriceLine._internal_update();
        }
        this._private__priceLineView._internal_update();
        this._private__baseHorizontalLineView._internal_update();
        (_a = this._private__lastPriceAnimationPaneView) === null || _a === void 0 ? void 0 : _a._internal_update();
        this._private__primitives.forEach((wrapper) => wrapper._internal_updateAllViews());
    }
    _internal_priceScale() {
        return ensureNotNull(super._internal_priceScale());
    }
    _internal_markerDataAtIndex(index) {
        const getValue = (this._private__seriesType === 'Line' || this._private__seriesType === 'Area' || this._private__seriesType === 'Baseline') &&
            this._private__options.crosshairMarkerVisible;
        if (!getValue) {
            return null;
        }
        const bar = this._private__data._internal_valueAt(index);
        if (bar === null) {
            return null;
        }
        const price = bar._internal_value[3 /* PlotRowValueIndex.Close */];
        const radius = this._private__markerRadius();
        const borderColor = this._private__markerBorderColor();
        const borderWidth = this._private__markerBorderWidth();
        const backgroundColor = this._private__markerBackgroundColor(index);
        return { _internal_price: price, _internal_radius: radius, _internal_borderColor: borderColor, _internal_borderWidth: borderWidth, _internal_backgroundColor: backgroundColor };
    }
    _internal_title() {
        return this._private__options.title;
    }
    _internal_visible() {
        return this._private__options.visible;
    }
    _internal_attachPrimitive(primitive) {
        this._private__primitives.push(new SeriesPrimitiveWrapper(primitive, this));
    }
    _internal_detachPrimitive(source) {
        this._private__primitives = this._private__primitives.filter((wrapper) => wrapper._internal_primitive() !== source);
    }
    _internal_customSeriesPlotValuesBuilder() {
        if (this._private__paneView instanceof SeriesCustomPaneView === false) {
            return undefined;
        }
        return (data) => {
            return this._private__paneView._internal_priceValueBuilder(data);
        };
    }
    _internal_customSeriesWhitespaceCheck() {
        if (this._private__paneView instanceof SeriesCustomPaneView === false) {
            return undefined;
        }
        return (data) => {
            return this._private__paneView._internal_isWhitespace(data);
        };
    }
    _private__isOverlay() {
        const priceScale = this._internal_priceScale();
        return !isDefaultPriceScale(priceScale._internal_id());
    }
    _private__autoscaleInfoImpl(startTimePoint, endTimePoint) {
        if (!isInteger(startTimePoint) || !isInteger(endTimePoint) || this._private__data._internal_isEmpty()) {
            return null;
        }
        // TODO: refactor this
        // series data is strongly hardcoded to keep bars
        const plots = this._private__seriesType === 'Line' || this._private__seriesType === 'Area' || this._private__seriesType === 'Baseline' || this._private__seriesType === 'Histogram'
            ? [3 /* PlotRowValueIndex.Close */]
            : [2 /* PlotRowValueIndex.Low */, 1 /* PlotRowValueIndex.High */];
        const barsMinMax = this._private__data._internal_minMaxOnRangeCached(startTimePoint, endTimePoint, plots);
        let range = barsMinMax !== null ? new PriceRangeImpl(barsMinMax._internal_min, barsMinMax._internal_max) : null;
        if (this._internal_seriesType() === 'Histogram') {
            const base = this._private__options.base;
            const rangeWithBase = new PriceRangeImpl(base, base);
            range = range !== null ? range._internal_merge(rangeWithBase) : rangeWithBase;
        }
        let margins = this._private__markersPaneView._internal_autoScaleMargins();
        this._private__primitives.forEach((primitive) => {
            const primitiveAutoscale = primitive._internal_autoscaleInfo(startTimePoint, endTimePoint);
            if (primitiveAutoscale === null || primitiveAutoscale === void 0 ? void 0 : primitiveAutoscale.priceRange) {
                const primitiveRange = new PriceRangeImpl(primitiveAutoscale.priceRange.minValue, primitiveAutoscale.priceRange.maxValue);
                range = range !== null ? range._internal_merge(primitiveRange) : primitiveRange;
            }
            if (primitiveAutoscale === null || primitiveAutoscale === void 0 ? void 0 : primitiveAutoscale.margins) {
                margins = mergeMargins(margins, primitiveAutoscale.margins);
            }
        });
        return new AutoscaleInfoImpl(range, margins);
    }
    _private__markerRadius() {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline':
                return this._private__options.crosshairMarkerRadius;
        }
        return 0;
    }
    _private__markerBorderColor() {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline': {
                const crosshairMarkerBorderColor = this._private__options.crosshairMarkerBorderColor;
                if (crosshairMarkerBorderColor.length !== 0) {
                    return crosshairMarkerBorderColor;
                }
            }
        }
        return null;
    }
    _private__markerBorderWidth() {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline':
                return this._private__options.crosshairMarkerBorderWidth;
        }
        return 0;
    }
    _private__markerBackgroundColor(index) {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline': {
                const crosshairMarkerBackgroundColor = this._private__options.crosshairMarkerBackgroundColor;
                if (crosshairMarkerBackgroundColor.length !== 0) {
                    return crosshairMarkerBackgroundColor;
                }
            }
        }
        return this._internal_barColorer()._internal_barStyle(index)._internal_barColor;
    }
    _private__recreateFormatter() {
        switch (this._private__options.priceFormat.type) {
            case 'custom': {
                this._private__formatter = { format: this._private__options.priceFormat.formatter };
                break;
            }
            case 'volume': {
                this._private__formatter = new VolumeFormatter(this._private__options.priceFormat.precision);
                break;
            }
            case 'percent': {
                this._private__formatter = new PercentageFormatter(this._private__options.priceFormat.precision);
                break;
            }
            default: {
                const priceScale = Math.pow(10, this._private__options.priceFormat.precision);
                this._private__formatter = new PriceFormatter(priceScale, this._private__options.priceFormat.minMove * priceScale);
            }
        }
        if (this._internal__priceScale !== null) {
            this._internal__priceScale._internal_updateFormatter();
        }
    }
    _private__recalculateMarkers() {
        const timeScale = this._internal_model()._internal_timeScale();
        if (!timeScale._internal_hasPoints() || this._private__data._internal_isEmpty()) {
            this._private__indexedMarkers = [];
            return;
        }
        const firstDataIndex = ensureNotNull(this._private__data._internal_firstIndex());
        this._private__indexedMarkers = this._private__markers.map((marker, index) => {
            // the first find index on the time scale (across all series)
            const timePointIndex = ensureNotNull(timeScale._internal_timeToIndex(marker.time, true));
            // and then search that index inside the series data
            const searchMode = timePointIndex < firstDataIndex ? 1 /* MismatchDirection.NearestRight */ : -1 /* MismatchDirection.NearestLeft */;
            const seriesDataIndex = ensureNotNull(this._private__data._internal_search(timePointIndex, searchMode))._internal_index;
            return {
                time: seriesDataIndex,
                position: marker.position,
                shape: marker.shape,
                color: marker.color,
                id: marker.id,
                _internal_internalId: index,
                text: marker.text,
                size: marker.size,
                originalTime: marker.originalTime,
            };
        });
    }
    _private__recreatePaneViews(customPaneView) {
        this._private__markersPaneView = new SeriesMarkersPaneView(this, this._internal_model());
        switch (this._private__seriesType) {
            case 'Bar': {
                this._private__paneView = new SeriesBarsPaneView(this, this._internal_model());
                break;
            }
            case 'Candlestick': {
                this._private__paneView = new SeriesCandlesticksPaneView(this, this._internal_model());
                break;
            }
            case 'Line': {
                this._private__paneView = new SeriesLinePaneView(this, this._internal_model());
                break;
            }
            case 'Custom': {
                this._private__paneView = new SeriesCustomPaneView(this, this._internal_model(), ensureDefined(customPaneView));
                break;
            }
            case 'Area': {
                this._private__paneView = new SeriesAreaPaneView(this, this._internal_model());
                break;
            }
            case 'Baseline': {
                this._private__paneView = new SeriesBaselinePaneView(this, this._internal_model());
                break;
            }
            case 'Histogram': {
                this._private__paneView = new SeriesHistogramPaneView(this, this._internal_model());
                break;
            }
            default: throw Error('Unknown chart style assigned: ' + this._private__seriesType);
        }
    }
    _private__extractPaneViews(extractor, zOrder) {
        const res = [];
        extractPrimitivePaneViews(this._private__primitives, extractor, zOrder, res);
        return res;
    }
}
function mergeMargins(source, additionalMargin) {
    var _a, _b;
    return {
        above: Math.max((_a = source === null || source === void 0 ? void 0 : source.above) !== null && _a !== void 0 ? _a : 0, additionalMargin.above),
        below: Math.max((_b = source === null || source === void 0 ? void 0 : source.below) !== null && _b !== void 0 ? _b : 0, additionalMargin.below),
    };
}
