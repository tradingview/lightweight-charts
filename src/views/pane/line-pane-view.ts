import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem, PaneRendererLine, PaneRendererLineData } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesLinePaneView extends LinePaneViewBase<'Line', LineItem> {
	private readonly _lineRenderer: PaneRendererLine = new PaneRendererLine();

	// eslint-disable-next-line no-useless-constructor
	public constructor(series: Series<'Line'>, model: ChartModel) {
		super(series, model);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const lineStyleProps = this._series.options();

		this._makeValid();
		const data: PaneRendererLineData = {
			items: this._items,
			lineColor: lineStyleProps.color,
			lineStyle: lineStyleProps.lineStyle,
			lineType: lineStyleProps.lineType,
			lineWidth: lineStyleProps.lineWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		this._lineRenderer.setData(data);

		return this._lineRenderer;
	}

	protected override _updateOptions(): void {
		this._items.forEach((item: LineItem) => {
			item.color = this._series.barColorer().barStyle(item.time).barColor;
		});
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer): LineItem {
		const item = this._createRawItemBase(time, price) as LineItem;
		item.color = colorer.barStyle(time).barColor;
		return item;
	}
}
