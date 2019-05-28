import { PriceScaleMode } from '../../model/price-scale';
import { Series } from '../../model/series';

import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';

export class SeriesHorizontalBaseLinePaneView extends SeriesHorizontalLinePaneView {
	public constructor(series: Series) {
		super(series);
	}

	protected _updateImpl(): void {
		this._lineRendererData.visible = false;

		const mode = this._series.priceScale().mode().mode;
		if (mode !== PriceScaleMode.Percentage && mode !== PriceScaleMode.IndexedTo100) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}

		this._lineRendererData.visible = true;
		this._lineRendererData.y = this._series.priceScale().priceToCoordinate(firstValue, firstValue);
		this._lineRendererData.width = this._model.timeScale().width();
		this._lineRendererData.height = this._series.priceScale().height();
		this._lineRendererData.color = this._series.options().baseLineColor;
	}
}
