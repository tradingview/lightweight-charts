import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';
export class SeriesHorizontalBaseLinePaneView extends SeriesHorizontalLinePaneView {
    // eslint-disable-next-line no-useless-constructor
    constructor(series) {
        super(series);
    }
    _internal__updateImpl() {
        this._internal__lineRendererData._internal_visible = false;
        const priceScale = this._internal__series._internal_priceScale();
        const mode = priceScale._internal_mode()._internal_mode;
        if (mode !== 2 /* PriceScaleMode.Percentage */ && mode !== 3 /* PriceScaleMode.IndexedTo100 */) {
            return;
        }
        const seriesOptions = this._internal__series._internal_options();
        if (!seriesOptions.baseLineVisible || !this._internal__series._internal_visible()) {
            return;
        }
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return;
        }
        this._internal__lineRendererData._internal_visible = true;
        this._internal__lineRendererData._internal_y = priceScale._internal_priceToCoordinate(firstValue._internal_value, firstValue._internal_value);
        this._internal__lineRendererData._internal_color = seriesOptions.baseLineColor;
        this._internal__lineRendererData._internal_lineWidth = seriesOptions.baseLineWidth;
        this._internal__lineRendererData._internal_lineStyle = seriesOptions.baseLineStyle;
    }
}
