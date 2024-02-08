import { ensureNotNull } from '../helpers/assertions';
import { notNull } from '../helpers/strict-type-checks';
import { CrosshairMarksPaneView } from '../views/pane/crosshair-marks-pane-view';
import { CrosshairPaneView } from '../views/pane/crosshair-pane-view';
import { CrosshairPriceAxisView } from '../views/price-axis/crosshair-price-axis-view';
import { CrosshairTimeAxisView } from '../views/time-axis/crosshair-time-axis-view';
import { DataSource } from './data-source';
/**
 * Represents the crosshair mode.
 */
export var CrosshairMode;
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
})(CrosshairMode || (CrosshairMode = {}));
export class Crosshair extends DataSource {
    constructor(model, options) {
        super();
        this._private__pane = null;
        this._private__price = NaN;
        this._private__index = 0;
        this._private__visible = true;
        this._private__priceAxisViews = new Map();
        this._private__subscribed = false;
        this._private__x = NaN;
        this._private__y = NaN;
        this._private__originX = NaN;
        this._private__originY = NaN;
        this._private__model = model;
        this._private__options = options;
        this._private__markersPaneView = new CrosshairMarksPaneView(model, this);
        const valuePriceProvider = (rawPriceProvider, rawCoordinateProvider) => {
            return (priceScale) => {
                const coordinate = rawCoordinateProvider();
                const rawPrice = rawPriceProvider();
                if (priceScale === ensureNotNull(this._private__pane)._internal_defaultPriceScale()) {
                    // price must be defined
                    return { _internal_price: rawPrice, _internal_coordinate: coordinate };
                }
                else {
                    // always convert from coordinate
                    const firstValue = ensureNotNull(priceScale._internal_firstValue());
                    const price = priceScale._internal_coordinateToPrice(coordinate, firstValue);
                    return { _internal_price: price, _internal_coordinate: coordinate };
                }
            };
        };
        const valueTimeProvider = (rawIndexProvider, rawCoordinateProvider) => {
            return () => {
                const time = this._private__model._internal_timeScale()._internal_indexToTime(rawIndexProvider());
                const coordinate = rawCoordinateProvider();
                if (!time || !Number.isFinite(coordinate)) {
                    return null;
                }
                return {
                    _internal_time: time,
                    _internal_coordinate: coordinate,
                };
            };
        };
        // for current position always return both price and coordinate
        this._private__currentPosPriceProvider = valuePriceProvider(() => this._private__price, () => this._private__y);
        const currentPosTimeProvider = valueTimeProvider(() => this._private__index, () => this._internal_appliedX());
        this._private__timeAxisView = new CrosshairTimeAxisView(this, model, currentPosTimeProvider);
        this._private__paneView = new CrosshairPaneView(this);
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_saveOriginCoord(x, y) {
        this._private__originX = x;
        this._private__originY = y;
    }
    _internal_clearOriginCoord() {
        this._private__originX = NaN;
        this._private__originY = NaN;
    }
    _internal_originCoordX() {
        return this._private__originX;
    }
    _internal_originCoordY() {
        return this._private__originY;
    }
    _internal_setPosition(index, price, pane) {
        if (!this._private__subscribed) {
            this._private__subscribed = true;
        }
        this._private__visible = true;
        this._private__tryToUpdateViews(index, price, pane);
    }
    _internal_appliedIndex() {
        return this._private__index;
    }
    _internal_appliedX() {
        return this._private__x;
    }
    _internal_appliedY() {
        return this._private__y;
    }
    _internal_visible() {
        return this._private__visible;
    }
    _internal_clearPosition() {
        this._private__visible = false;
        this._private__setIndexToLastSeriesBarIndex();
        this._private__price = NaN;
        this._private__x = NaN;
        this._private__y = NaN;
        this._private__pane = null;
        this._internal_clearOriginCoord();
    }
    _internal_paneViews(pane) {
        return this._private__pane !== null ? [this._private__paneView, this._private__markersPaneView] : [];
    }
    _internal_horzLineVisible(pane) {
        return pane === this._private__pane && this._private__options.horzLine.visible;
    }
    _internal_vertLineVisible() {
        return this._private__options.vertLine.visible;
    }
    _internal_priceAxisViews(pane, priceScale) {
        if (!this._private__visible || this._private__pane !== pane) {
            this._private__priceAxisViews.clear();
        }
        const views = [];
        if (this._private__pane === pane) {
            views.push(this._private__createPriceAxisViewOnDemand(this._private__priceAxisViews, priceScale, this._private__currentPosPriceProvider));
        }
        return views;
    }
    _internal_timeAxisViews() {
        return this._private__visible ? [this._private__timeAxisView] : [];
    }
    _internal_pane() {
        return this._private__pane;
    }
    _internal_updateAllViews() {
        this._private__paneView._internal_update();
        this._private__priceAxisViews.forEach((value) => value._internal_update());
        this._private__timeAxisView._internal_update();
        this._private__markersPaneView._internal_update();
    }
    _private__priceScaleByPane(pane) {
        if (pane && !pane._internal_defaultPriceScale()._internal_isEmpty()) {
            return pane._internal_defaultPriceScale();
        }
        return null;
    }
    _private__tryToUpdateViews(index, price, pane) {
        if (this._private__tryToUpdateData(index, price, pane)) {
            this._internal_updateAllViews();
        }
    }
    _private__tryToUpdateData(newIndex, newPrice, newPane) {
        const oldX = this._private__x;
        const oldY = this._private__y;
        const oldPrice = this._private__price;
        const oldIndex = this._private__index;
        const oldPane = this._private__pane;
        const priceScale = this._private__priceScaleByPane(newPane);
        this._private__index = newIndex;
        this._private__x = isNaN(newIndex) ? NaN : this._private__model._internal_timeScale()._internal_indexToCoordinate(newIndex);
        this._private__pane = newPane;
        const firstValue = priceScale !== null ? priceScale._internal_firstValue() : null;
        if (priceScale !== null && firstValue !== null) {
            this._private__price = newPrice;
            this._private__y = priceScale._internal_priceToCoordinate(newPrice, firstValue);
        }
        else {
            this._private__price = NaN;
            this._private__y = NaN;
        }
        return (oldX !== this._private__x || oldY !== this._private__y || oldIndex !== this._private__index ||
            oldPrice !== this._private__price || oldPane !== this._private__pane);
    }
    _private__setIndexToLastSeriesBarIndex() {
        const lastIndexes = this._private__model._internal_serieses()
            .map((s) => s._internal_bars()._internal_lastIndex())
            .filter(notNull);
        const lastBarIndex = (lastIndexes.length === 0) ? null : Math.max(...lastIndexes);
        this._private__index = lastBarIndex !== null ? lastBarIndex : NaN;
    }
    _private__createPriceAxisViewOnDemand(map, priceScale, valueProvider) {
        let view = map.get(priceScale);
        if (view === undefined) {
            view = new CrosshairPriceAxisView(this, priceScale, valueProvider);
            map.set(priceScale, view);
        }
        return view;
    }
}
