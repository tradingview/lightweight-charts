import { merge } from '../helpers/strict-type-checks';
import { CustomBoxPaneView } from '../views/pane/custom-box-pane-view';
export class CustomBox {
    constructor(series, options) {
        this._series = series;
        this._options = options;
        this._boxView = new CustomBoxPaneView(series, this);
        // this._priceAxisView = new CustomPriceLinePriceAxisView(series, this);
        // this._panePriceAxisView = new PanePriceAxisView(this._priceAxisView, series, series.model());
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
        return this._boxView;
    }
    // public labelPaneView(): IPaneView {
    // 	return this._panePriceAxisView;
    // }
    // public priceAxisView(): IPriceAxisView {
    // 	return this._priceAxisView;
    // }
    update() {
        this._boxView.update();
        // this._priceAxisView.update();
    }
    xLowCoord() {
        return this.xCoord(this._options.earlyTime);
    }
    xHighCoord() {
        return this.xCoord(this._options.lateTime);
    }
    yLowCoord() {
        // low Y coord = the high price (it is intentionally flipped)
        return this.yCoord(this._options.highPrice);
    }
    yHighCoord() {
        // high Y coord = the low price (it is intentionally flipped)
        return this.yCoord(this._options.lowPrice);
    }
    xCoord(time) {
        const series = this._series;
        const timeScale = series.model().timeScale();
        const timeIndex = timeScale.timeToIndex(time, true);
        if (timeScale.isEmpty() || timeIndex === null) {
            return null;
        }
        return timeScale.indexToCoordinate(timeIndex);
    }
    yCoord(price) {
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
        return priceScale.priceToCoordinate(price, firstValue.value);
    }
}
