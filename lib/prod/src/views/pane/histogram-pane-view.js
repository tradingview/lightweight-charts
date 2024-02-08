import { ensureNotNull } from '../../helpers/assertions';
import { PaneRendererHistogram } from '../../renderers/histogram-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesHistogramPaneView extends LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererHistogram();
    }
    _internal__createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._internal__createRawItemBase(time, price)), colorer._internal_barStyle(time));
    }
    _internal__prepareRendererData() {
        const data = {
            _internal_items: this._internal__items,
            _internal_barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_histogramBase: this._internal__series._internal_priceScale()._internal_priceToCoordinate(this._internal__series._internal_options().base, ensureNotNull(this._internal__series._internal_firstValue())._internal_value),
        };
        this._internal__renderer._internal_setData(data);
    }
}
