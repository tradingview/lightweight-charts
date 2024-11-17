import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';
export class CustomPriceLinePaneView extends SeriesHorizontalLinePaneView {
    constructor(series, priceLine) {
        super(series);
        this._priceLine = priceLine;
    }
    _updateImpl() {
        const data = this._lineRendererData;
        data.visible = false;
        const lineOptions = this._priceLine.options();
        if (!this._series.visible() || !lineOptions.lineVisible) {
            return;
        }
        const y = this._priceLine.yCoord();
        if (y === null) {
            return;
        }
        data.visible = true;
        data.y = y;
        data.color = lineOptions.color;
        data.lineWidth = lineOptions.lineWidth;
        data.lineStyle = lineOptions.lineStyle;
        data.externalId = this._priceLine.options().id;
    }
}
