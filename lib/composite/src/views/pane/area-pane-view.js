"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesAreaPaneView = void 0;
const area_renderer_1 = require("../../renderers/area-renderer");
const composite_renderer_1 = require("../../renderers/composite-renderer");
const line_renderer_1 = require("../../renderers/line-renderer");
const line_pane_view_base_1 = require("./line-pane-view-base");
class SeriesAreaPaneView extends line_pane_view_base_1.LinePaneViewBase {
    constructor(series, model) {
        super(series, model);
        this._renderer = new composite_renderer_1.CompositeRenderer();
        this._areaRenderer = new area_renderer_1.PaneRendererArea();
        this._lineRenderer = new line_renderer_1.PaneRendererLine();
        this._renderer.setRenderers([this._areaRenderer, this._lineRenderer]);
    }
    _createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._createRawItemBase(time, price)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const options = this._series.options();
        this._areaRenderer.setData({
            lineType: options.lineType,
            items: this._items,
            lineStyle: options.lineStyle,
            lineWidth: options.lineWidth,
            baseLevelCoordinate: null,
            invertFilledArea: options.invertFilledArea,
            visibleRange: this._itemsVisibleRange,
            barWidth: this._model.timeScale().barSpacing(),
        });
        this._lineRenderer.setData({
            lineType: options.lineVisible ? options.lineType : undefined,
            items: this._items,
            lineStyle: options.lineStyle,
            lineWidth: options.lineWidth,
            visibleRange: this._itemsVisibleRange,
            barWidth: this._model.timeScale().barSpacing(),
            pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
        });
    }
}
exports.SeriesAreaPaneView = SeriesAreaPaneView;
