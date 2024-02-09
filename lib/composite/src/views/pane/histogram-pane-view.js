"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesHistogramPaneView = void 0;
const assertions_1 = require("../../helpers/assertions");
const histogram_renderer_1 = require("../../renderers/histogram-renderer");
const line_pane_view_base_1 = require("./line-pane-view-base");
class SeriesHistogramPaneView extends line_pane_view_base_1.LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new histogram_renderer_1.PaneRendererHistogram();
    }
    _createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._createRawItemBase(time, price)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const data = {
            items: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            visibleRange: this._itemsVisibleRange,
            histogramBase: this._series.priceScale().priceToCoordinate(this._series.options().base, (0, assertions_1.ensureNotNull)(this._series.firstValue()).value),
        };
        this._renderer.setData(data);
    }
}
exports.SeriesHistogramPaneView = SeriesHistogramPaneView;
