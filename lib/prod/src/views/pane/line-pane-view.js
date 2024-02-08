import { PaneRendererLine } from '../../renderers/line-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesLinePaneView extends LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererLine();
    }
    _internal__createRawItem(time, price, colorer) {
        return Object.assign(Object.assign({}, this._internal__createRawItemBase(time, price)), colorer._internal_barStyle(time));
    }
    _internal__prepareRendererData() {
        const options = this._internal__series._internal_options();
        const data = {
            _internal_items: this._internal__items,
            _internal_lineStyle: options.lineStyle,
            _internal_lineType: options.lineVisible ? options.lineType : undefined,
            _internal_lineWidth: options.lineWidth,
            _internal_pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: this._internal__model._internal_timeScale()._internal_barSpacing(),
        };
        this._internal__renderer._internal_setData(data);
    }
}
