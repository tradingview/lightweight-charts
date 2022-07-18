import { BarPrice } from '../../model/bar';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { LineStrokeItem, PaneRendererLine, PaneRendererLineData } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesLinePaneView extends LinePaneViewBase<'Line', LineStrokeItem, PaneRendererLine> {
	protected readonly _renderer: PaneRendererLine = new PaneRendererLine();

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer<'Line'>): LineStrokeItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}

	protected _prepareRendererData(): void {
		const lineStyleProps = this._series.options();

		const data: PaneRendererLineData = {
			items: this._items,
			lineStyle: lineStyleProps.lineStyle,
			lineType: lineStyleProps.lineType,
			lineWidth: lineStyleProps.lineWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		this._renderer.setData(data);
	}
}
