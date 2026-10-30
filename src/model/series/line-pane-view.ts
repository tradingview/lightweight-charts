import { BarPrice } from '../../model/bar';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { LineStrokeItem, PaneRendererLine, PaneRendererLineData } from '../../renderers/line-renderer';

import { LineHitTestPaneViewBase } from './line-hit-test-pane-view-base';

export class SeriesLinePaneView extends LineHitTestPaneViewBase<'Line', LineStrokeItem, PaneRendererLine> {
	protected readonly _renderer: PaneRendererLine = new PaneRendererLine();

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Line'>): LineStrokeItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}

	protected _prepareRendererData(): void {
		const options = this._series.options();

		const data: PaneRendererLineData = {
			items: this._items,
			lineStyle: options.lineStyle,
			lineType: options.lineVisible ? options.lineType : undefined,
			lineWidth: options.lineWidth,
			pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
			connectGaps: options.connectGaps as boolean,
		};

		this._renderer.setData(data);
	}
}
