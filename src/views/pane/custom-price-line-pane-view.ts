import { CustomPriceLine } from '../../model/custom-price-line';
import { Series } from '../../model/series';

import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';

export class CustomPriceLinePaneView extends SeriesHorizontalLinePaneView {
	private readonly _priceLine: CustomPriceLine;

	public constructor(series: Series, priceLine: CustomPriceLine) {
		super(series);
		this._priceLine = priceLine;
	}

	protected _updateImpl(): void {
		const data = this._lineRendererData;
		data.visible = false;

		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();

		if (timeScale.isEmpty() || priceScale.isEmpty()) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}

		const lineOptions = this._priceLine.options();

		data.visible = true;
		data.y = priceScale.priceToCoordinate(lineOptions.price, firstValue.value);
		data.color = lineOptions.color;
		data.width = timeScale.width();
		data.height = priceScale.height();
		data.lineWidth = lineOptions.lineWidth;
		data.lineStyle = lineOptions.lineStyle;
	}
}
