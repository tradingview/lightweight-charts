import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
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

	public renderer(height: number, width: number): IPaneRenderer | null {
		const candlestickStyleProps = this._series.options();
		if (!candlestickStyleProps.visible) {
			return null;
		}

		this._makeValid();
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

	protected _createRawItem(time: TimePointIndex, bar: SeriesPlotRow, colorer: SeriesBarColorer): CandlestickItem {
		const style = colorer.barStyle(time);
		return {
			...this._createDefaultItem(time, bar, colorer),
			color: style.barColor,
			wickColor: style.barWickColor,
			borderColor: style.barBorderColor,
		};
	}
}
