import { CustomPriceLine } from '../../model/custom-price-line';
import { Series } from '../../model/series';

import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';

export class CustomPriceLinePaneView extends SeriesHorizontalLinePaneView {
	public priceLine: CustomPriceLine;

	public constructor(series: Series, priceLine: CustomPriceLine) {
		super(series);
		this.priceLine = priceLine;
	}

	protected _updateImpl(): void {
		const data = this._lineRendererData;
		data.visible = false;

		const lineOptions = this.priceLine.options();

		if (!this._series.visible() || !lineOptions.lineVisible) {
			return;
		}

		const y = this.priceLine.yCoord();
		if (y === null) {
			return;
		}

		data.visible = true;
		data.y = y;
		data.color = lineOptions.color;
		data.lineWidth = lineOptions.lineWidth;
		data.lineStyle = lineOptions.lineStyle;
		data.externalId = this.priceLine.options().id;
	}
}
