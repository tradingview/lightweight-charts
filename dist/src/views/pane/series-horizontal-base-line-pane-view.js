import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';
export class SeriesHorizontalBaseLinePaneView extends SeriesHorizontalLinePaneView {
    // eslint-disable-next-line no-useless-constructor
    constructor(series) {
        super(series);
    }
    _updateImpl() {
        this._lineRendererData.visible = false;
        const priceScale = this._series.priceScale();
        const mode = priceScale.mode().mode;
        if (mode !== 2 /* PriceScaleMode.Percentage */ && mode !== 3 /* PriceScaleMode.IndexedTo100 */) {
            return;
        }
        const seriesOptions = this._series.options();
        if (!seriesOptions.baseLineVisible || !this._series.visible()) {
            return;
        }
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return;
        }
        this._lineRendererData.visible = true;
        this._lineRendererData.y = priceScale.priceToCoordinate(firstValue.value, firstValue.value);
        this._lineRendererData.color = seriesOptions.baseLineColor;
        this._lineRendererData.lineWidth = seriesOptions.baseLineWidth;
        this._lineRendererData.lineStyle = seriesOptions.baseLineStyle;
    }
}
