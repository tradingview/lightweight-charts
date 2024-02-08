import { PaneRendererBars, } from '../../renderers/bars-renderer';
import { BarsPaneViewBase } from './bars-pane-view-base';
export class SeriesBarsPaneView extends BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererBars();
    }
    _internal__createRawItem(time, bar, colorer) {
        return Object.assign(Object.assign({}, this._internal__createDefaultItem(time, bar, colorer)), colorer._internal_barStyle(time));
    }
    _internal__prepareRendererData() {
        const barStyleProps = this._internal__series._internal_options();
        this._internal__renderer._internal_setData({
            _internal_bars: this._internal__items,
            _internal_barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            _internal_openVisible: barStyleProps.openVisible,
            _internal_thinBars: barStyleProps.thinBars,
            _internal_visibleRange: this._internal__itemsVisibleRange,
        });
    }
}
