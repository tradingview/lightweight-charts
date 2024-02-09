"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesBaselinePaneView = void 0;
const baseline_renderer_area_1 = require("../../renderers/baseline-renderer-area");
const baseline_renderer_line_1 = require("../../renderers/baseline-renderer-line");
const composite_renderer_1 = require("../../renderers/composite-renderer");
const line_pane_view_base_1 = require("./line-pane-view-base");
class SeriesBaselinePaneView extends line_pane_view_base_1.LinePaneViewBase {
    constructor(series, model) {
        super(series, model);
        this._renderer = new composite_renderer_1.CompositeRenderer();
        this._baselineAreaRenderer = new baseline_renderer_area_1.PaneRendererBaselineArea();
        this._baselineLineRenderer = new baseline_renderer_line_1.PaneRendererBaselineLine();
        this._renderer.setRenderers([this._baselineAreaRenderer, this._baselineLineRenderer]);
    }
    _createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._createRawItemBase(time, price)), colorer.barStyle(time));
    }
    _prepareRendererData() {
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return;
        }
        const options = this._series.options();
        const baseLevelCoordinate = this._series.priceScale().priceToCoordinate(options.baseValue.price, firstValue.value);
        const barWidth = this._model.timeScale().barSpacing();
        this._baselineAreaRenderer.setData({
            items: this._items,
            lineWidth: options.lineWidth,
            lineStyle: options.lineStyle,
            lineType: options.lineType,
            baseLevelCoordinate,
            invertFilledArea: false,
            visibleRange: this._itemsVisibleRange,
            barWidth,
        });
        this._baselineLineRenderer.setData({
            items: this._items,
            lineWidth: options.lineWidth,
            lineStyle: options.lineStyle,
            lineType: options.lineVisible ? options.lineType : undefined,
            pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            baseLevelCoordinate,
            visibleRange: this._itemsVisibleRange,
            barWidth,
        });
    }
}
exports.SeriesBaselinePaneView = SeriesBaselinePaneView;
