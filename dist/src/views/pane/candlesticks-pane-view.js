import { PaneRendererCandlesticks, } from '../../renderers/candlesticks-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
export class SeriesCandlesticksPaneView extends BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new PaneRendererCandlesticks();
    }
    _createRawItem(time, bar, colorer) {
        return Object.assign(Object.assign({}, this._createDefaultItem(time, bar, colorer)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const candlestickStyleProps = this._series.options();
        this._renderer.setData({
            bars: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            wickVisible: candlestickStyleProps.wickVisible,
            borderVisible: candlestickStyleProps.borderVisible,
            visibleRange: this._itemsVisibleRange,
        });
    }
}
