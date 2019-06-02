import { Series } from '../../model/series';
import { LineStyle } from '../../renderers/draw-line';

import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';

export class SeriesPriceLinePaneView extends SeriesHorizontalLinePaneView {
	public constructor(series: Series) {
		super(series);
		this._lineRendererData.lineStyle = LineStyle.Dotted;
	}

	protected _updateImpl(): void {
		this._lineRendererData.visible = false;

		const seriesOptions = this._series.options();
		if (!seriesOptions.priceLineVisible) {
			return;
		}

		const data = this._series.lastValueData(undefined, true);
		if (data.noData) {
			return;
		}

		this._lineRendererData.visible = true;
		this._lineRendererData.y = data.coordinate;
		this._lineRendererData.color = this._series.priceLineColor(data.color);
		this._lineRendererData.width = this._model.timeScale().width();
		this._lineRendererData.height = this._series.priceScale().height();
		this._lineRendererData.lineWidth = seriesOptions.priceLineWidth;
	}
}
