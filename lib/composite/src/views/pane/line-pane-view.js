"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesLinePaneView = void 0;
const line_renderer_1 = require("../../renderers/line-renderer");
const line_pane_view_base_1 = require("./line-pane-view-base");
class SeriesLinePaneView extends line_pane_view_base_1.LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new line_renderer_1.PaneRendererLine();
    }
    _createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._createRawItemBase(time, price)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const options = this._series.options();
        const data = {
            items: this._items,
            lineStyle: options.lineStyle,
            lineType: options.lineVisible ? options.lineType : undefined,
            lineWidth: options.lineWidth,
            pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            visibleRange: this._itemsVisibleRange,
            barWidth: this._model.timeScale().barSpacing(),
        };
        this._renderer.setData(data);
    }
}
exports.SeriesLinePaneView = SeriesLinePaneView;
