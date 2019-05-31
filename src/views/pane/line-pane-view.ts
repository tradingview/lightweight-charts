import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Series } from '../../model/series';
import { TimePointIndex } from '../../model/time-data';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem, PaneRendererLine, PaneRendererLineData } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesLinePaneView extends LinePaneViewBase<LineItem> {
	private readonly _lineRenderer: PaneRendererLine = new PaneRendererLine();

	public constructor(series: Series, model: ChartModel) {
		super(series, model);
	}

	public renderer(height: number, width: number): IPaneRenderer {
		this._makeValid();

		const lineStyleProps = this._series.internalOptions().lineStyle;

		const data: PaneRendererLineData = {
			items: this._items,
			lineColor: lineStyleProps.color,
			lineStyle: lineStyleProps.lineStyle,
			lineType: 0,
			lineWidth: lineStyleProps.lineWidth,
			visibleRange: this._itemsVisibleRange,
		};

		this._lineRenderer.setData(data);

		return this._lineRenderer;
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice): LineItem {
		return this._createRawItemBase(time, price);
	}
}
