import { ensureNotNull } from '../../helpers/assertions';

import { BarPrice } from '../../model/bar';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { HistogramItem, PaneRendererHistogram, PaneRendererHistogramData } from '../../renderers/histogram-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesHistogramPaneView extends LinePaneViewBase<'Histogram', HistogramItem, PaneRendererHistogram> {
	protected readonly _renderer: PaneRendererHistogram = new PaneRendererHistogram();

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer<'Histogram'>): HistogramItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}

	protected _prepareRendererData(): void {
		const data: PaneRendererHistogramData = {
			items: this._items,
			barSpacing: this._model.timeScale().barSpacing(),
			visibleRange: this._itemsVisibleRange,
			histogramBase: this._series.priceScale().priceToCoordinate(this._series.options().base, ensureNotNull(this._series.firstValue()).value),
		};

		this._renderer.setData(data);
	}
}
