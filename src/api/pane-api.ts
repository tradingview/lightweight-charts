import { IChartWidgetBase } from '../gui/chart-widget';

import { assert } from '../helpers/assertions';

import { Pane } from '../model/pane';
import { SeriesType } from '../model/series-options';

import { IChartApiBase } from './ichart-api';
import { IPaneApi } from './ipane-api';
import { ISeriesApi } from './iseries-api';

export class PaneApi<HorzScaleItem> implements IPaneApi<HorzScaleItem> {
	private _chartWidget: IChartWidgetBase;
	private _pane: Pane;
	private readonly _chartApi: IChartApiBase<HorzScaleItem>;

	public constructor(chartApi: IChartApiBase<HorzScaleItem>, chartWidget: IChartWidgetBase, pane: Pane) {
		this._chartWidget = chartWidget;
		this._chartApi = chartApi;
		this._pane = pane;
	}

	public getHeight(): number {
		return this._pane.height();
	}

	public setHeight(height: number): void {
		const chartModel = this._chartWidget.model();
		const paneIndex = chartModel.getPaneIndex(this._pane);
		chartModel.changePanesHeight(paneIndex, height);
	}

	public paneIndex(): number {
		return this._chartWidget.model().getPaneIndex(this._pane);
	}

	public moveTo(paneIndex: number): void {
		const currentIndex = this.paneIndex();

		if (currentIndex === paneIndex) {
			return;
		}

		assert(paneIndex >= 0 && paneIndex < this._chartWidget.paneWidgets().length, 'Invalid pane index');

		this._chartWidget.model().swapPanes(currentIndex, paneIndex);
	}

	public series(): ISeriesApi<SeriesType, HorzScaleItem>[] {
		return this._chartApi.getSeriesByPane(this);
	}
}
