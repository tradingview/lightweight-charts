import { PaneRendererArea } from '../../renderers/area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { PaneRendererLine } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesAreaPaneView extends LinePaneViewBase {
    constructor(series, model) {
        super(series, model);
        this._renderer = new CompositeRenderer();
        this._areaRenderer = new PaneRendererArea();
        this._lineRenderer = new PaneRendererLine();
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
