"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesPriceLinePaneView = void 0;
const series_horizontal_line_pane_view_1 = require("./series-horizontal-line-pane-view");
class SeriesPriceLinePaneView extends series_horizontal_line_pane_view_1.SeriesHorizontalLinePaneView {
    // eslint-disable-next-line no-useless-constructor
    constructor(series) {
        super(series);
    }
    _updateImpl() {
        const data = this._lineRendererData;
        data.visible = false;
        const seriesOptions = this._series.options();
        if (!seriesOptions.priceLineVisible || !this._series.visible()) {
            return;
        }
        const lastValueData = this._series.lastValueData(seriesOptions.priceLineSource === 0 /* PriceLineSource.LastBar */);
        if (lastValueData.noData) {
            return;
        }
        data.visible = true;
        data.y = lastValueData.coordinate;
        data.color = this._series.priceLineColor(lastValueData.color);
        data.lineWidth = seriesOptions.priceLineWidth;
        data.lineStyle = seriesOptions.priceLineStyle;
    }
}
exports.SeriesPriceLinePaneView = SeriesPriceLinePaneView;
