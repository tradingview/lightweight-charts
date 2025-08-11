import { ISeries } from '../../model/iseries';
import { PriceLineSource, SeriesType } from '../../model/series-options';

import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';

export class SeriesPriceLinePaneView extends SeriesHorizontalLinePaneView {
	// eslint-disable-next-line no-useless-constructor
	public constructor(series: ISeries<SeriesType>) {
		super(series);
	}

	protected _updateImpl(): void {
		const data = this._lineRendererData;
		data.visible = false;

		const seriesOptions = this._series.options();
		if (!seriesOptions.priceLineVisible || !this._series.visible()) {
			return;
		}

		const lastValueData = this._series.lastValueData(seriesOptions.priceLineSource === PriceLineSource.LastBar);
		if (lastValueData.noData) {
			return;
		}

		const withData = lastValueData as unknown as import('../../model/iseries').LastValueDataResultWithData;
		data.visible = true;
		data.y = withData.coordinate;
		data.color = this._series.priceLineColor(withData.color);
		data.lineWidth = seriesOptions.priceLineWidth;
		data.lineStyle = seriesOptions.priceLineStyle;
	}
}
