import { ensureNotNull } from '../helpers/assertions';
import { isDefaultPriceScale } from '../model/default-price-scale';
export class PriceScaleApi {
    constructor(chartWidget, priceScaleId) {
        this._private__chartWidget = chartWidget;
        this._private__priceScaleId = priceScaleId;
    }
    applyOptions(options) {
        this._private__chartWidget._internal_model()._internal_applyPriceScaleOptions(this._private__priceScaleId, options);
    }
    options() {
        return this._private__priceScale()._internal_options();
    }
    width() {
        if (!isDefaultPriceScale(this._private__priceScaleId)) {
            return 0;
        }
        return this._private__chartWidget._internal_getPriceAxisWidth(this._private__priceScaleId);
    }
    _private__priceScale() {
        return ensureNotNull(this._private__chartWidget._internal_model()._internal_findPriceScale(this._private__priceScaleId))._internal_priceScale;
    }
}
