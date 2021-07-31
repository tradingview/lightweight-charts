import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { TimePointIndex } from '../../model/time-data';
import { PaneRendererArea, PaneRendererAreaData } from '../../renderers/area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesAreaPaneView extends LinePaneViewBase<'Area', LineItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _areaRenderer: PaneRendererArea = new PaneRendererArea();

	public constructor(series: Series<'Area'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._areaRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const areaStyleProperties = this._series.options();
		this._makeValid();
		const data: PaneRendererAreaData = {
			lineType: areaStyleProperties.lineType,
			items: this._items,
			topLineColor: areaStyleProperties.topLineColor,
			bottomLineColor: areaStyleProperties.bottomLineColor,
			lineStyle: areaStyleProperties.lineStyle,
			lineWidth: areaStyleProperties.lineWidth,
			topFillColor1: areaStyleProperties.topFillColor1,
			topFillColor2: areaStyleProperties.topFillColor2,
			bottomFillColor1: areaStyleProperties.bottomFillColor1,
			bottomFillColor2: areaStyleProperties.bottomFillColor2,
			bottom: height as Coordinate,
			baseLine: this._series.priceScale().priceToCoordinate(areaStyleProperties.baselinePrice, 0),
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		this._areaRenderer.setData(data);

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice): LineItem {
		return this._createRawItemBase(time, price);
	}
}
