import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';
export class SeriesPriceLinePaneView extends SeriesHorizontalLinePaneView {
    // eslint-disable-next-line no-useless-constructor
    constructor(series) {
        super(series);
    }
    _internal__updateImpl() {
        const data = this._internal__lineRendererData;
        data._internal_visible = false;
        const seriesOptions = this._internal__series._internal_options();
        if (!seriesOptions.priceLineVisible || !this._internal__series._internal_visible()) {
            return;
        }
        const lastValueData = this._internal__series._internal_lastValueData(seriesOptions.priceLineSource === 0 /* PriceLineSource.LastBar */);
        if (lastValueData._internal_noData) {
            return;
        }
        data._internal_visible = true;
        data._internal_y = lastValueData._internal_coordinate;
        data._internal_color = this._internal__series._internal_priceLineColor(lastValueData._internal_color);
        data._internal_lineWidth = seriesOptions.priceLineWidth;
        data._internal_lineStyle = seriesOptions.priceLineStyle;
    }
}
