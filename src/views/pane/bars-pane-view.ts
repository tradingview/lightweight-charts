import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
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

	public renderer(height: number, width: number): IPaneRenderer | null {
		const barStyleProps = this._series.options();
		if (!barStyleProps.visible) {
			return null;
		}

		this._makeValid();
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

	protected _createRawItem(time: TimePointIndex, bar: SeriesPlotRow, colorer: SeriesBarColorer): BarItem {
		return {
			...this._createDefaultItem(time, bar, colorer),
			color: colorer.barStyle(time).barColor,
		};
	}
}
