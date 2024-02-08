import { merge } from '../helpers/strict-type-checks';
import { CustomPriceLinePaneView } from '../views/pane/custom-price-line-pane-view';
import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
import { CustomPriceLinePriceAxisView } from '../views/price-axis/custom-price-line-price-axis-view';
export class CustomPriceLine {
    constructor(series, options) {
        this._private__series = series;
        this._private__options = options;
        this._private__priceLineView = new CustomPriceLinePaneView(series, this);
        this._private__priceAxisView = new CustomPriceLinePriceAxisView(series, this);
        this._private__panePriceAxisView = new PanePriceAxisView(this._private__priceAxisView, series, series._internal_model());
    }
    _internal_applyOptions(options) {
        merge(this._private__options, options);
        this._internal_update();
        this._private__series._internal_model()._internal_lightUpdate();
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_paneView() {
        return this._private__priceLineView;
    }
    _internal_labelPaneView() {
        return this._private__panePriceAxisView;
    }
    _internal_priceAxisView() {
        return this._private__priceAxisView;
    }
    _internal_update() {
        this._private__priceLineView._internal_update();
        this._private__priceAxisView._internal_update();
    }
    _internal_yCoord() {
        const series = this._private__series;
        const priceScale = series._internal_priceScale();
        const timeScale = series._internal_model()._internal_timeScale();
        if (timeScale._internal_isEmpty() || priceScale._internal_isEmpty()) {
            return null;
        }
        const firstValue = series._internal_firstValue();
        if (firstValue === null) {
            return null;
        }
        return priceScale._internal_priceToCoordinate(this._private__options.price, firstValue._internal_value);
    }
}
