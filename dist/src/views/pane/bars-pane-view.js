import { PaneRendererBars, } from '../../renderers/bars-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
export class SeriesBarsPaneView extends BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new PaneRendererBars();
    }
    _createRawItem(time, bar, colorer) {
        return Object.assign(Object.assign({}, this._createDefaultItem(time, bar, colorer)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const barStyleProps = this._series.options();
        this._renderer.setData({
            bars: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            openVisible: barStyleProps.openVisible,
            thinBars: barStyleProps.thinBars,
            visibleRange: this._itemsVisibleRange,
        });
    }
}
