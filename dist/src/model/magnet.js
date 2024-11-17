import { ensure } from '../helpers/assertions';
import { Series } from './series';
export class Magnet {
    constructor(options) {
        this._options = options;
    }
    align(price, index, pane) {
        let res = price;
        if (this._options.mode === 0 /* CrosshairMode.Normal */) {
            return res;
        }
        const defaultPriceScale = pane.defaultPriceScale();
        const firstValue = defaultPriceScale.firstValue();
        if (firstValue === null) {
            return res;
        }
        const y = defaultPriceScale.priceToCoordinate(price, firstValue);
        // get all serieses from the pane
        const serieses = pane.dataSources().filter(((ds) => (ds instanceof Series)));
        const candidates = serieses.reduce((acc, series) => {
            if (pane.isOverlay(series) || !series.visible()) {
                return acc;
            }
            const ps = series.priceScale();
            const bars = series.bars();
            if (ps.isEmpty() || !bars.contains(index)) {
                return acc;
            }
            const bar = bars.valueAt(index);
            if (bar === null) {
                return acc;
            }
            // convert bar to pixels
            const firstPrice = ensure(series.firstValue());
            return acc.concat([ps.priceToCoordinate(bar.value[3 /* PlotRowValueIndex.Close */], firstPrice.value)]);
        }, []);
        if (candidates.length === 0) {
            return res;
        }
        candidates.sort((y1, y2) => Math.abs(y1 - y) - Math.abs(y2 - y));
        const nearest = candidates[0];
        res = defaultPriceScale.coordinateToPrice(nearest, firstValue);
        return res;
    }
}
