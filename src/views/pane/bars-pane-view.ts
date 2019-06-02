import { ChartModel } from '../../model/chart-model';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { Bar } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import {
	BarItem,
	PaneRendererBars,
	PaneRendererBarsData,
} from '../../renderers/bars-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { BarsPaneViewBase } from './bars-pane-view-base';

export class SeriesBarsPaneView extends BarsPaneViewBase<'Bar', BarItem> {
	private readonly _renderer: PaneRendererBars = new PaneRendererBars();

	public constructor(series: Series<'Bar'>, model: ChartModel) {
		super(series, model);
	}

	public renderer(height: number, width: number): IPaneRenderer {
		this._makeValid();

		const barStyleProps = this._series.options();
		const data: PaneRendererBarsData = {
			bars: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			openVisible: barStyleProps.openVisible,
			thinBars: barStyleProps.thinBars,
			visibleRange: this._itemsVisibleRange,
		};

		this._renderer.setData(data);

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, bar: Bar, colorer: SeriesBarColorer): BarItem {
		return {
			...this._createDefaultItem(time, bar, colorer),
			color: colorer.barStyle(time).barColor,
		};
	}

}
