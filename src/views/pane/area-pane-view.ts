import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { TimePointIndex } from '../../model/time-data';
import { PaneRendererArea, PaneRendererAreaData } from '../../renderers/area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem, PaneRendererLine } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesAreaPaneView extends LinePaneViewBase<'Area', LineItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _areaRenderer: PaneRendererArea = new PaneRendererArea();
	private readonly _lineRenderer: PaneRendererLine = new PaneRendererLine();

	public constructor(series: Series<'Area'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._areaRenderer, this._lineRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer {
		this._makeValid();

		const areaStyleProperties = this._series.options();

		const data: PaneRendererAreaData = {
			lineType: areaStyleProperties.lineType,
			items: this._items,
			lineColor: areaStyleProperties.lineColor,
			lineStyle: areaStyleProperties.lineStyle,
			lineWidth: areaStyleProperties.lineWidth,
			topColor: areaStyleProperties.topColor,
			bottomColor: areaStyleProperties.bottomColor,
			bottom: height as Coordinate,
			visibleRange: this._itemsVisibleRange,
		};

		this._areaRenderer.setData(data);
		this._lineRenderer.setData(data);

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice): LineItem {
		return this._createRawItemBase(time, price);
	}
}
