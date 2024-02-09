"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceScaleApi = void 0;
const assertions_1 = require("../helpers/assertions");
const default_price_scale_1 = require("../model/default-price-scale");
class PriceScaleApi {
    constructor(chartWidget, priceScaleId) {
        this._chartWidget = chartWidget;
        this._priceScaleId = priceScaleId;
    }
    applyOptions(options) {
        this._chartWidget.model().applyPriceScaleOptions(this._priceScaleId, options);
    }
    options() {
        return this._priceScale().options();
    }
    width() {
        if (!(0, default_price_scale_1.isDefaultPriceScale)(this._priceScaleId)) {
            return 0;
        }
        return this._chartWidget.getPriceAxisWidth(this._priceScaleId);
    }
    _priceScale() {
        return (0, assertions_1.ensureNotNull)(this._chartWidget.model().findPriceScale(this._priceScaleId)).priceScale;
    }
}
exports.PriceScaleApi = PriceScaleApi;
