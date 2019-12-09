import { ChartModel } from '../../model/chart-model';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { Bar } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import {
	CandlestickItem,
	PaneRendererCandlesticks,
	PaneRendererCandlesticksData,
} from '../../renderers/candlesticks-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { BarsPaneViewBase } from './bars-pane-view-base';

export class SeriesCandlesticksPaneView extends BarsPaneViewBase<'Candlestick', CandlestickItem> {
	private readonly _renderer: PaneRendererCandlesticks = new PaneRendererCandlesticks();

	public constructor(series: Series<'Candlestick'>, model: ChartModel) {
		super(series, model);
	}

	public renderer(height: number, width: number): IPaneRenderer {
		this._makeValid();

		const candlestickStyleProps = this._series.options();
		const data: PaneRendererCandlesticksData = {
			bars: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			wickVisible: candlestickStyleProps.wickVisible,
			borderVisible: candlestickStyleProps.borderVisible,
			visibleRange: this._itemsVisibleRange,
		};

		this._renderer.setData(data);

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, bar: Bar, colorer: SeriesBarColorer): CandlestickItem {
		const style = colorer.barStyle(time);
		return {
			...this._createDefaultItem(time, bar, colorer),
			color: style.barColor,
			wickColor: style.barWickColor,
			borderColor: style.barBorderColor,
		};
	}
}
