import { PaneRendererBaselineArea } from '../../renderers/baseline-renderer-area';
import { PaneRendererBaselineLine } from '../../renderers/baseline-renderer-line';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesBaselinePaneView extends LinePaneViewBase {
    constructor(series, model) {
        super(series, model);
        this._renderer = new CompositeRenderer();
        this._baselineAreaRenderer = new PaneRendererBaselineArea();
        this._baselineLineRenderer = new PaneRendererBaselineLine();
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
