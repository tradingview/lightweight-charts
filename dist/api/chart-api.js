import { ChartWidget } from '../gui/chart-widget';
import { assert, ensure, ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, isBoolean, merge } from '../helpers/strict-type-checks';
import { isFulfilledData } from '../model/data-consumer';
import { DataLayer } from '../model/data-layer';
import { fillUpDownCandlesticksColors, precisionByMinMove, } from '../model/series-options';
import { getSeriesDataCreator } from './get-series-data-creator';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import { areaStyleDefaults, barStyleDefaults, baselineStyleDefaults, candlestickStyleDefaults, customStyleDefaults, histogramStyleDefaults, lineStyleDefaults, seriesOptionsDefaults, } from './options/series-options-defaults';
import { PriceScaleApi } from './price-scale-api';
import { SeriesApi } from './series-api';
import { TimeScaleApi } from './time-scale-api';
function patchPriceFormat(priceFormat) {
    if (priceFormat === undefined || priceFormat.type === 'custom') {
        return;
    }
    const priceFormatBuiltIn = priceFormat;
    if (priceFormatBuiltIn.minMove !== undefined && priceFormatBuiltIn.precision === undefined) {
        priceFormatBuiltIn.precision = precisionByMinMove(priceFormatBuiltIn.minMove);
    }
}
function migrateHandleScaleScrollOptions(options) {
    if (isBoolean(options.handleScale)) {
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
        if (isBoolean(axisPressedMouseMove)) {
            options.handleScale.axisPressedMouseMove = {
                time: axisPressedMouseMove,
                price: axisPressedMouseMove,
            };
        }
        if (isBoolean(axisDoubleClickReset)) {
            options.handleScale.axisDoubleClickReset = {
                time: axisDoubleClickReset,
                price: axisDoubleClickReset,
            };
        }
    }
    const handleScroll = options.handleScroll;
    if (isBoolean(handleScroll)) {
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
export class ChartApi {
    constructor(container, horzScaleBehavior, options) {
        this._seriesMap = new Map();
        this._seriesMapReversed = new Map();
        this._clickedDelegate = new Delegate();
        this._dblClickedDelegate = new Delegate();
        this._crosshairMovedDelegate = new Delegate();
        this._dataLayer = new DataLayer(horzScaleBehavior);
        const internalOptions = (options === undefined) ?
            clone(chartOptionsDefaults()) :
            merge(clone(chartOptionsDefaults()), toInternalOptions(options));
        this._horzScaleBehavior = horzScaleBehavior;
        this._chartWidget = new ChartWidget(container, internalOptions, horzScaleBehavior);
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
        this._timeScaleApi = new TimeScaleApi(model, this._chartWidget.timeAxisWidget(), this._horzScaleBehavior);
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
            warn(`Height and width values ignored because 'autoSize' option is enabled.`);
            return;
        }
        this._chartWidget.resize(width, height, forceRepaint);
    }
    addCustomSeries(customPaneView, options) {
        const paneView = ensure(customPaneView);
        const defaults = Object.assign(Object.assign({}, customStyleDefaults), paneView.defaultOptions());
        return this._addSeriesImpl('Custom', defaults, options, paneView);
    }
    addAreaSeries(options) {
        return this._addSeriesImpl('Area', areaStyleDefaults, options);
    }
    addBaselineSeries(options) {
        return this._addSeriesImpl('Baseline', baselineStyleDefaults, options);
    }
    addBarSeries(options) {
        return this._addSeriesImpl('Bar', barStyleDefaults, options);
    }
    addCandlestickSeries(options = {}) {
        fillUpDownCandlesticksColors(options);
        return this._addSeriesImpl('Candlestick', candlestickStyleDefaults, options);
    }
    addHistogramSeries(options) {
        return this._addSeriesImpl('Histogram', histogramStyleDefaults, options);
    }
    addLineSeries(options) {
        return this._addSeriesImpl('Line', lineStyleDefaults, options);
    }
    removeSeries(seriesApi) {
        const series = ensureDefined(this._seriesMap.get(seriesApi));
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
        return new PriceScaleApi(this._chartWidget, priceScaleId);
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
        const strictOptions = merge(clone(seriesOptionsDefaults), clone(styleDefaults), options);
        const series = this._chartWidget.model().createSeries(type, strictOptions, customPaneView);
        const res = new SeriesApi(series, this, this, this, this._horzScaleBehavior);
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
        return ensureDefined(this._seriesMapReversed.get(series));
    }
    _convertMouseParams(param) {
        const seriesData = new Map();
        param.seriesData.forEach((plotRow, series) => {
            const seriesType = series.seriesType();
            const data = getSeriesDataCreator(seriesType)(plotRow);
            if (seriesType !== 'Custom') {
                assert(isFulfilledData(data));
            }
            else {
                const customWhitespaceChecker = series.customSeriesWhitespaceCheck();
                assert(!customWhitespaceChecker || customWhitespaceChecker(data) === false);
            }
            seriesData.set(this._mapSeriesToApi(series), data);
        });
        const hoveredSeries = param.hoveredSeries === undefined ||
            !this._seriesMapReversed.has(param.hoveredSeries)
            ? undefined
            : this._mapSeriesToApi(param.hoveredSeries);
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
