import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { AreaFillItem, PaneRendererArea } from '../../renderers/area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineStrokeItem, PaneRendererLine } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesAreaPaneView extends LinePaneViewBase<'Area', AreaFillItem & LineStrokeItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _areaRenderer: PaneRendererArea = new PaneRendererArea();
	private readonly _lineRenderer: PaneRendererLine = new PaneRendererLine();

	public constructor(series: Series<'Area'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._areaRenderer, this._lineRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const areaStyleProperties = this._series.options();

		this._makeValid();

		this._areaRenderer.setData({
			lineType: areaStyleProperties.lineType,
			items: this._items,
			lineStyle: areaStyleProperties.lineStyle,
			lineWidth: areaStyleProperties.lineWidth,
			topColor: areaStyleProperties.topColor,
			bottomColor: areaStyleProperties.bottomColor,
			baseLevelCoordinate: height as Coordinate,
			bottom: height as Coordinate,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		});

		this._lineRenderer.setData({
			lineType: areaStyleProperties.lineType,
			items: this._items,
			lineColor: areaStyleProperties.lineColor,
			lineStyle: areaStyleProperties.lineStyle,
			lineWidth: areaStyleProperties.lineWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		});

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer<'Area'>): AreaFillItem & LineStrokeItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}
}
