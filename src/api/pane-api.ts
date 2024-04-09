import { IChartWidgetBase } from '../gui/chart-widget';

import { assert } from '../helpers/assertions';

import { Pane } from '../model/pane';

import { IPaneApi } from './ipane-api';

export class PaneApi implements IPaneApi {
	private _chartWidget: IChartWidgetBase;
	private _pane: Pane;

	public constructor(chartWidget: IChartWidgetBase, pane: Pane) {
		this._chartWidget = chartWidget;
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
}
