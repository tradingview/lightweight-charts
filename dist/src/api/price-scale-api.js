import { ensureNotNull } from '../helpers/assertions';
import { isDefaultPriceScale } from '../model/default-price-scale';
export class PriceScaleApi {
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
        if (!isDefaultPriceScale(this._priceScaleId)) {
            return 0;
        }
        return this._chartWidget.getPriceAxisWidth(this._priceScaleId);
    }
    _priceScale() {
        return ensureNotNull(this._chartWidget.model().findPriceScale(this._priceScaleId)).priceScale;
    }
}
