"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartApi = void 0;
const chart_widget_1 = require("../gui/chart-widget");
const assertions_1 = require("../helpers/assertions");
const delegate_1 = require("../helpers/delegate");
const logger_1 = require("../helpers/logger");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const data_consumer_1 = require("../model/data-consumer");
const data_layer_1 = require("../model/data-layer");
const series_options_1 = require("../model/series-options");
const get_series_data_creator_1 = require("./get-series-data-creator");
const chart_options_defaults_1 = require("./options/chart-options-defaults");
const series_options_defaults_1 = require("./options/series-options-defaults");
const price_scale_api_1 = require("./price-scale-api");
const series_api_1 = require("./series-api");
const time_scale_api_1 = require("./time-scale-api");
function patchPriceFormat(priceFormat) {
    if (priceFormat === undefined || priceFormat.type === 'custom') {
        return;
    }
    const priceFormatBuiltIn = priceFormat;
    if (priceFormatBuiltIn.minMove !== undefined && priceFormatBuiltIn.precision === undefined) {
        priceFormatBuiltIn.precision = (0, series_options_1.precisionByMinMove)(priceFormatBuiltIn.minMove);
    }
}
function migrateHandleScaleScrollOptions(options) {
    if ((0, strict_type_checks_1.isBoolean)(options.handleScale)) {
        const handleScale = options.handleScale;
        options.handleScale = {
            axisDoubleClickReset: {
                time: handleScale,
                price: handleScale,
            },
            axisPressedMouseMove: {
                time: handleScale,
                price: handleScale,
            },
            mouseWheel: handleScale,
            pinch: handleScale,
        };
    }
    else if (options.handleScale !== undefined) {
        const { axisPressedMouseMove, axisDoubleClickReset } = options.handleScale;
        if ((0, strict_type_checks_1.isBoolean)(axisPressedMouseMove)) {
            options.handleScale.axisPressedMouseMove = {
                time: axisPressedMouseMove,
                price: axisPressedMouseMove,
            };
        }
        if ((0, strict_type_checks_1.isBoolean)(axisDoubleClickReset)) {
            options.handleScale.axisDoubleClickReset = {
                time: axisDoubleClickReset,
                price: axisDoubleClickReset,
            };
        }
    }
    const handleScroll = options.handleScroll;
    if ((0, strict_type_checks_1.isBoolean)(handleScroll)) {
        options.handleScroll = {
            horzTouchDrag: handleScroll,
            vertTouchDrag: handleScroll,
            mouseWheel: handleScroll,
            pressedMouseMove: handleScroll,
        };
    }
}
function toInternalOptions(options) {
    migrateHandleScaleScrollOptions(options);
    return options;
}
class ChartApi {
    constructor(container, horzScaleBehavior, options) {
        this._seriesMap = new Map();
        this._seriesMapReversed = new Map();
        this._clickedDelegate = new delegate_1.Delegate();
        this._dblClickedDelegate = new delegate_1.Delegate();
        this._crosshairMovedDelegate = new delegate_1.Delegate();
        this._dataLayer = new data_layer_1.DataLayer(horzScaleBehavior);
        const internalOptions = (options === undefined) ?
            (0, strict_type_checks_1.clone)((0, chart_options_defaults_1.chartOptionsDefaults)()) :
            (0, strict_type_checks_1.merge)((0, strict_type_checks_1.clone)((0, chart_options_defaults_1.chartOptionsDefaults)()), toInternalOptions(options));
        this._horzScaleBehavior = horzScaleBehavior;
        this._chartWidget = new chart_widget_1.ChartWidget(container, internalOptions, horzScaleBehavior);
        this._chartWidget.clicked().subscribe((paramSupplier) => {
            if (this._clickedDelegate.hasListeners()) {
                this._clickedDelegate.fire(this._convertMouseParams(paramSupplier()));
            }
        }, this);
        this._chartWidget.dblClicked().subscribe((paramSupplier) => {
            if (this._dblClickedDelegate.hasListeners()) {
                this._dblClickedDelegate.fire(this._convertMouseParams(paramSupplier()));
            }
        }, this);
        this._chartWidget.crosshairMoved().subscribe((paramSupplier) => {
            if (this._crosshairMovedDelegate.hasListeners()) {
                this._crosshairMovedDelegate.fire(this._convertMouseParams(paramSupplier()));
            }
        }, this);
        const model = this._chartWidget.model();
        this._timeScaleApi = new time_scale_api_1.TimeScaleApi(model, this._chartWidget.timeAxisWidget(), this._horzScaleBehavior);
    }
    remove() {
        this._chartWidget.clicked().unsubscribeAll(this);
        this._chartWidget.dblClicked().unsubscribeAll(this);
        this._chartWidget.crosshairMoved().unsubscribeAll(this);
        this._timeScaleApi.destroy();
        this._chartWidget.destroy();
        this._seriesMap.clear();
        this._seriesMapReversed.clear();
        this._clickedDelegate.destroy();
        this._dblClickedDelegate.destroy();
        this._crosshairMovedDelegate.destroy();
        this._dataLayer.destroy();
    }
    resize(width, height, forceRepaint) {
        if (this.autoSizeActive()) {
            // We return early here instead of checking this within the actual _chartWidget.resize method
            // because this should only apply to external resize requests.
            (0, logger_1.warn)(`Height and width values ignored because 'autoSize' option is enabled.`);
            return;
        }
        this._chartWidget.resize(width, height, forceRepaint);
    }
    addCustomSeries(customPaneView, options) {
        const paneView = (0, assertions_1.ensure)(customPaneView);
        const defaults = Object.assign(Object.assign({}, series_options_defaults_1.customStyleDefaults), paneView.defaultOptions());
        return this._addSeriesImpl('Custom', defaults, options, paneView);
    }
    addAreaSeries(options) {
        return this._addSeriesImpl('Area', series_options_defaults_1.areaStyleDefaults, options);
    }
    addBaselineSeries(options) {
        return this._addSeriesImpl('Baseline', series_options_defaults_1.baselineStyleDefaults, options);
    }
    addBarSeries(options) {
        return this._addSeriesImpl('Bar', series_options_defaults_1.barStyleDefaults, options);
    }
    addCandlestickSeries(options = {}) {
        (0, series_options_1.fillUpDownCandlesticksColors)(options);
        return this._addSeriesImpl('Candlestick', series_options_defaults_1.candlestickStyleDefaults, options);
    }
    addHistogramSeries(options) {
        return this._addSeriesImpl('Histogram', series_options_defaults_1.histogramStyleDefaults, options);
    }
    addLineSeries(options) {
        return this._addSeriesImpl('Line', series_options_defaults_1.lineStyleDefaults, options);
    }
    removeSeries(seriesApi) {
        const series = (0, assertions_1.ensureDefined)(this._seriesMap.get(seriesApi));
        const update = this._dataLayer.removeSeries(series);
        const model = this._chartWidget.model();
        model.removeSeries(series);
        this._sendUpdateToChart(update);
        this._seriesMap.delete(seriesApi);
        this._seriesMapReversed.delete(series);
    }
    applyNewData(series, data) {
        this._sendUpdateToChart(this._dataLayer.setSeriesData(series, data));
    }
    updateData(series, data) {
        this._sendUpdateToChart(this._dataLayer.updateSeriesData(series, data));
    }
    subscribeClick(handler) {
        this._clickedDelegate.subscribe(handler);
    }
    unsubscribeClick(handler) {
        this._clickedDelegate.unsubscribe(handler);
    }
    subscribeCrosshairMove(handler) {
        this._crosshairMovedDelegate.subscribe(handler);
    }
    unsubscribeCrosshairMove(handler) {
        this._crosshairMovedDelegate.unsubscribe(handler);
    }
    subscribeDblClick(handler) {
        this._dblClickedDelegate.subscribe(handler);
    }
    unsubscribeDblClick(handler) {
        this._dblClickedDelegate.unsubscribe(handler);
    }
    priceScale(priceScaleId) {
        return new price_scale_api_1.PriceScaleApi(this._chartWidget, priceScaleId);
    }
    timeScale() {
        return this._timeScaleApi;
    }
    applyOptions(options) {
        this._chartWidget.applyOptions(toInternalOptions(options));
    }
    options() {
        return this._chartWidget.options();
    }
    takeScreenshot() {
        return this._chartWidget.takeScreenshot();
    }
    autoSizeActive() {
        return this._chartWidget.autoSizeActive();
    }
    chartElement() {
        return this._chartWidget.element();
    }
    paneSize() {
        const size = this._chartWidget.paneSize();
        return {
            height: size.height,
            width: size.width,
        };
    }
    setCrosshairPosition(price, horizontalPosition, seriesApi) {
        const series = this._seriesMap.get(seriesApi);
        if (series === undefined) {
            return;
        }
        const pane = this._chartWidget.model().paneForSource(series);
        if (pane === null) {
            return;
        }
        this._chartWidget.model().setAndSaveSyntheticPosition(price, horizontalPosition, pane);
    }
    clearCrosshairPosition() {
        this._chartWidget.model().clearCurrentPosition(true);
    }
    _addSeriesImpl(type, styleDefaults, options = {}, customPaneView) {
        patchPriceFormat(options.priceFormat);
        const strictOptions = (0, strict_type_checks_1.merge)((0, strict_type_checks_1.clone)(series_options_defaults_1.seriesOptionsDefaults), (0, strict_type_checks_1.clone)(styleDefaults), options);
        const series = this._chartWidget.model().createSeries(type, strictOptions, customPaneView);
        const res = new series_api_1.SeriesApi(series, this, this, this, this._horzScaleBehavior);
        this._seriesMap.set(res, series);
        this._seriesMapReversed.set(series, res);
        return res;
    }
    _sendUpdateToChart(update) {
        const model = this._chartWidget.model();
        model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
        update.series.forEach((value, series) => series.setData(value.data, value.info));
        model.recalculateAllPanes();
    }
    _mapSeriesToApi(series) {
        return (0, assertions_1.ensureDefined)(this._seriesMapReversed.get(series));
    }
    _convertMouseParams(param) {
        const seriesData = new Map();
        param.seriesData.forEach((plotRow, series) => {
            const seriesType = series.seriesType();
            const data = (0, get_series_data_creator_1.getSeriesDataCreator)(seriesType)(plotRow);
            if (seriesType !== 'Custom') {
                (0, assertions_1.assert)((0, data_consumer_1.isFulfilledData)(data));
            }
            else {
                const customWhitespaceChecker = series.customSeriesWhitespaceCheck();
                (0, assertions_1.assert)(!customWhitespaceChecker || customWhitespaceChecker(data) === false);
            }
            seriesData.set(this._mapSeriesToApi(series), data);
        });
        const hoveredSeries = param.hoveredSeries === undefined ? undefined : this._mapSeriesToApi(param.hoveredSeries);
        return {
            time: param.originalTime,
            logical: param.index,
            point: param.point,
            hoveredSeries,
            hoveredObjectId: param.hoveredObject,
            seriesData,
            sourceEvent: param.touchMouseEventData,
        };
    }
}
exports.ChartApi = ChartApi;
