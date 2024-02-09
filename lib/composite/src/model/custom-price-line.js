"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomPriceLine = void 0;
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const custom_price_line_pane_view_1 = require("../views/pane/custom-price-line-pane-view");
const pane_price_axis_view_1 = require("../views/pane/pane-price-axis-view");
const custom_price_line_price_axis_view_1 = require("../views/price-axis/custom-price-line-price-axis-view");
class CustomPriceLine {
    constructor(series, options) {
        this._series = series;
        this._options = options;
        this._priceLineView = new custom_price_line_pane_view_1.CustomPriceLinePaneView(series, this);
        this._priceAxisView = new custom_price_line_price_axis_view_1.CustomPriceLinePriceAxisView(series, this);
        this._panePriceAxisView = new pane_price_axis_view_1.PanePriceAxisView(this._priceAxisView, series, series.model());
    }
    applyOptions(options) {
        (0, strict_type_checks_1.merge)(this._options, options);
        this.update();
        this._series.model().lightUpdate();
    }
    options() {
        return this._options;
    }
    paneView() {
        return this._priceLineView;
    }
    labelPaneView() {
        return this._panePriceAxisView;
    }
    priceAxisView() {
        return this._priceAxisView;
    }
    update() {
        this._priceLineView.update();
        this._priceAxisView.update();
    }
    yCoord() {
        const series = this._series;
        const priceScale = series.priceScale();
        const timeScale = series.model().timeScale();
        if (timeScale.isEmpty() || priceScale.isEmpty()) {
            return null;
        }
        const firstValue = series.firstValue();
        if (firstValue === null) {
            return null;
        }
        return priceScale.priceToCoordinate(this._options.price, firstValue.value);
    }
}
exports.CustomPriceLine = CustomPriceLine;
