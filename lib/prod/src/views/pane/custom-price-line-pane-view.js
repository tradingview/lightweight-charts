import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';
export class CustomPriceLinePaneView extends SeriesHorizontalLinePaneView {
    constructor(series, priceLine) {
        super(series);
        this._private__priceLine = priceLine;
    }
    _internal__updateImpl() {
        const data = this._internal__lineRendererData;
        data._internal_visible = false;
        const lineOptions = this._private__priceLine._internal_options();
        if (!this._internal__series._internal_visible() || !lineOptions.lineVisible) {
            return;
        }
        const y = this._private__priceLine._internal_yCoord();
        if (y === null) {
            return;
        }
        data._internal_visible = true;
        data._internal_y = y;
        data._internal_color = lineOptions.color;
        data._internal_lineWidth = lineOptions.lineWidth;
        data._internal_lineStyle = lineOptions.lineStyle;
        data._internal_externalId = this._private__priceLine._internal_options().id;
    }
}
