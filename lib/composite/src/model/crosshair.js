"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crosshair = exports.CrosshairMode = void 0;
const assertions_1 = require("../helpers/assertions");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const crosshair_marks_pane_view_1 = require("../views/pane/crosshair-marks-pane-view");
const crosshair_pane_view_1 = require("../views/pane/crosshair-pane-view");
const crosshair_price_axis_view_1 = require("../views/price-axis/crosshair-price-axis-view");
const crosshair_time_axis_view_1 = require("../views/time-axis/crosshair-time-axis-view");
const data_source_1 = require("./data-source");
/**
 * Represents the crosshair mode.
 */
var CrosshairMode;
(function (CrosshairMode) {
    /**
     * This mode allows crosshair to move freely on the chart.
     */
    CrosshairMode[CrosshairMode["Normal"] = 0] = "Normal";
    /**
     * This mode sticks crosshair's horizontal line to the price value of a single-value series or to the close price of OHLC-based series.
     */
    CrosshairMode[CrosshairMode["Magnet"] = 1] = "Magnet";
    /**
     * This mode disables rendering of the crosshair.
     */
    CrosshairMode[CrosshairMode["Hidden"] = 2] = "Hidden";
})(CrosshairMode = exports.CrosshairMode || (exports.CrosshairMode = {}));
class Crosshair extends data_source_1.DataSource {
    constructor(model, options) {
        super();
        this._pane = null;
        this._price = NaN;
        this._index = 0;
        this._visible = true;
        this._priceAxisViews = new Map();
        this._subscribed = false;
        this._x = NaN;
        this._y = NaN;
        this._originX = NaN;
        this._originY = NaN;
        this._model = model;
        this._options = options;
        this._markersPaneView = new crosshair_marks_pane_view_1.CrosshairMarksPaneView(model, this);
        const valuePriceProvider = (rawPriceProvider, rawCoordinateProvider) => {
            return (priceScale) => {
                const coordinate = rawCoordinateProvider();
                const rawPrice = rawPriceProvider();
                if (priceScale === (0, assertions_1.ensureNotNull)(this._pane).defaultPriceScale()) {
                    // price must be defined
                    return { price: rawPrice, coordinate: coordinate };
                }
                else {
                    // always convert from coordinate
                    const firstValue = (0, assertions_1.ensureNotNull)(priceScale.firstValue());
                    const price = priceScale.coordinateToPrice(coordinate, firstValue);
                    return { price: price, coordinate: coordinate };
                }
            };
        };
        const valueTimeProvider = (rawIndexProvider, rawCoordinateProvider) => {
            return () => {
                const time = this._model.timeScale().indexToTime(rawIndexProvider());
                const coordinate = rawCoordinateProvider();
                if (!time || !Number.isFinite(coordinate)) {
                    return null;
                }
                return {
                    time,
                    coordinate,
                };
            };
        };
        // for current position always return both price and coordinate
        this._currentPosPriceProvider = valuePriceProvider(() => this._price, () => this._y);
        const currentPosTimeProvider = valueTimeProvider(() => this._index, () => this.appliedX());
        this._timeAxisView = new crosshair_time_axis_view_1.CrosshairTimeAxisView(this, model, currentPosTimeProvider);
        this._paneView = new crosshair_pane_view_1.CrosshairPaneView(this);
    }
    options() {
        return this._options;
    }
    saveOriginCoord(x, y) {
        this._originX = x;
        this._originY = y;
    }
    clearOriginCoord() {
        this._originX = NaN;
        this._originY = NaN;
    }
    originCoordX() {
        return this._originX;
    }
    originCoordY() {
        return this._originY;
    }
    setPosition(index, price, pane) {
        if (!this._subscribed) {
            this._subscribed = true;
        }
        this._visible = true;
        this._tryToUpdateViews(index, price, pane);
    }
    appliedIndex() {
        return this._index;
    }
    appliedX() {
        return this._x;
    }
    appliedY() {
        return this._y;
    }
    visible() {
        return this._visible;
    }
    clearPosition() {
        this._visible = false;
        this._setIndexToLastSeriesBarIndex();
        this._price = NaN;
        this._x = NaN;
        this._y = NaN;
        this._pane = null;
        this.clearOriginCoord();
    }
    paneViews(pane) {
        return this._pane !== null ? [this._paneView, this._markersPaneView] : [];
    }
    horzLineVisible(pane) {
        return pane === this._pane && this._options.horzLine.visible;
    }
    vertLineVisible() {
        return this._options.vertLine.visible;
    }
    priceAxisViews(pane, priceScale) {
        if (!this._visible || this._pane !== pane) {
            this._priceAxisViews.clear();
        }
        const views = [];
        if (this._pane === pane) {
            views.push(this._createPriceAxisViewOnDemand(this._priceAxisViews, priceScale, this._currentPosPriceProvider));
        }
        return views;
    }
    timeAxisViews() {
        return this._visible ? [this._timeAxisView] : [];
    }
    pane() {
        return this._pane;
    }
    updateAllViews() {
        this._paneView.update();
        this._priceAxisViews.forEach((value) => value.update());
        this._timeAxisView.update();
        this._markersPaneView.update();
    }
    _priceScaleByPane(pane) {
        if (pane && !pane.defaultPriceScale().isEmpty()) {
            return pane.defaultPriceScale();
        }
        return null;
    }
    _tryToUpdateViews(index, price, pane) {
        if (this._tryToUpdateData(index, price, pane)) {
            this.updateAllViews();
        }
    }
    _tryToUpdateData(newIndex, newPrice, newPane) {
        const oldX = this._x;
        const oldY = this._y;
        const oldPrice = this._price;
        const oldIndex = this._index;
        const oldPane = this._pane;
        const priceScale = this._priceScaleByPane(newPane);
        this._index = newIndex;
        this._x = isNaN(newIndex) ? NaN : this._model.timeScale().indexToCoordinate(newIndex);
        this._pane = newPane;
        const firstValue = priceScale !== null ? priceScale.firstValue() : null;
        if (priceScale !== null && firstValue !== null) {
            this._price = newPrice;
            this._y = priceScale.priceToCoordinate(newPrice, firstValue);
        }
        else {
            this._price = NaN;
            this._y = NaN;
        }
        return (oldX !== this._x || oldY !== this._y || oldIndex !== this._index ||
            oldPrice !== this._price || oldPane !== this._pane);
    }
    _setIndexToLastSeriesBarIndex() {
        const lastIndexes = this._model.serieses()
            .map((s) => s.bars().lastIndex())
            .filter(strict_type_checks_1.notNull);
        const lastBarIndex = (lastIndexes.length === 0) ? null : Math.max(...lastIndexes);
        this._index = lastBarIndex !== null ? lastBarIndex : NaN;
    }
    _createPriceAxisViewOnDemand(map, priceScale, valueProvider) {
        let view = map.get(priceScale);
        if (view === undefined) {
            view = new crosshair_price_axis_view_1.CrosshairPriceAxisView(this, priceScale, valueProvider);
            map.set(priceScale, view);
        }
        return view;
    }
}
exports.Crosshair = Crosshair;
