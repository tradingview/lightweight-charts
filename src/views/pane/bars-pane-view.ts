import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { SeriesPlotRow } from '../../model/series-data';
import { SeriesType } from '../../model/series-options';
import { TimePointIndex } from '../../model/time-data';
import {
	BarItem,
	PaneRendererBars,
} from '../../renderers/bars-renderer';

import { BarsPaneViewBase } from './bars-pane-view-base';

export class SeriesBarsPaneView<HorzScaleItem> extends BarsPaneViewBase<'Bar', BarItem, PaneRendererBars, HorzScaleItem> {
	protected readonly _renderer: PaneRendererBars = new PaneRendererBars();

	protected _createRawItem(time: TimePointIndex, bar: SeriesPlotRow<SeriesType, HorzScaleItem>, colorer: SeriesBarColorer<'Bar', HorzScaleItem>): BarItem {
		return {
			...this._createDefaultItem(time, bar, colorer),
			...colorer.barStyle(time),
		};
	}

	protected _prepareRendererData(): void {
		const barStyleProps = this._series.options();

		this._renderer.setData({
			bars: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			openVisible: barStyleProps.openVisible,
			thinBars: barStyleProps.thinBars,
			visibleRange: this._itemsVisibleRange,
		});
	}
}
