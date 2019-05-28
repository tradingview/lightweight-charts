import { ChartModel } from '../../model/chart-model';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { Bar } from '../../model/series-data';
import { TimePointIndex } from '../../model/time-data';
import {
	CandleItem,
	PaneRendererCandles,
	PaneRendererCandlesData,
} from '../../renderers/candles-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { BarsPaneViewBase } from './bars-pane-view-base';

export class SeriesCandlesPaneView extends BarsPaneViewBase<CandleItem> {
	private readonly _renderer: PaneRendererCandles = new PaneRendererCandles();

	public constructor(series: Series, model: ChartModel) {
		super(series, model);
	}

	public renderer(height: number, width: number): IPaneRenderer {
		this._makeValid();

		const candleStyleProps = this._series.options().candleStyle;
		const data: PaneRendererCandlesData = {
			bars: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			wickColor: candleStyleProps.wickColor,
			wickVisible: candleStyleProps.wickVisible,
			borderVisible: candleStyleProps.borderVisible,
			visibleRange: this._itemsVisibleRange,
		};

		this._renderer.setData(data);

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, bar: Bar, colorer: SeriesBarColorer): CandleItem {
		const style = colorer.barStyle(time);
		return {
			...this._createDefaultItem(time, bar, colorer),
			color: style.barColor,
			wickColor: style.barWickColor,
			borderColor: style.barBorderColor,
		};
	}
}
