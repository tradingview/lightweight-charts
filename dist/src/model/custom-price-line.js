import { merge } from '../helpers/strict-type-checks';
import { CustomPriceLinePaneView } from '../views/pane/custom-price-line-pane-view';
import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
import { CustomPriceLinePriceAxisView } from '../views/price-axis/custom-price-line-price-axis-view';
export class CustomPriceLine {
    constructor(series, options) {
        this._series = series;
        this._options = options;
        this._priceLineView = new CustomPriceLinePaneView(series, this);
        this._priceAxisView = new CustomPriceLinePriceAxisView(series, this);
        this._panePriceAxisView = new PanePriceAxisView(this._priceAxisView, series, series.model());
    }
    applyOptions(options) {
        merge(this._options, options);
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
