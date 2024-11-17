import { PaneRendererLine } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesLinePaneView extends LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._renderer = new PaneRendererLine();
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
