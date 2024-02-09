"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesCandlesticksPaneView = void 0;
const candlesticks_renderer_1 = require("../../renderers/candlesticks-renderer");
const bars_pane_view_base_1 = require("./bars-pane-view-base");
class SeriesCandlesticksPaneView extends bars_pane_view_base_1.BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new candlesticks_renderer_1.PaneRendererCandlesticks();
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
exports.SeriesCandlesticksPaneView = SeriesCandlesticksPaneView;
