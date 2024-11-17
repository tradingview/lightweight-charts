import { ensureNotNull } from '../../helpers/assertions';
import { PaneRendererHistogram } from '../../renderers/histogram-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesHistogramPaneView extends LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new PaneRendererHistogram();
    }
    _createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._createRawItemBase(time, price)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const data = {
            items: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            visibleRange: this._itemsVisibleRange,
            histogramBase: this._series.priceScale().priceToCoordinate(this._series.options().base, ensureNotNull(this._series.firstValue()).value),
        };
        this._renderer.setData(data);
    }
}
