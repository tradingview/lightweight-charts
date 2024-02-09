"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesBarsPaneView = void 0;
const bars_renderer_1 = require("../../renderers/bars-renderer");
const bars_pane_view_base_1 = require("./bars-pane-view-base");
class SeriesBarsPaneView extends bars_pane_view_base_1.BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new bars_renderer_1.PaneRendererBars();
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
exports.SeriesBarsPaneView = SeriesBarsPaneView;
