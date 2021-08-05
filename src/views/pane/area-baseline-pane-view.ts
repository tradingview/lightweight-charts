import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { BaseValueType } from '../../model/series-options';
import { TimePointIndex } from '../../model/time-data';
import { PaneRendererAreaBaseline, PaneRendererAreaBaselineData } from '../../renderers/area-baseline-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesAreaBaselinePaneView extends LinePaneViewBase<'AreaBaseline', LineItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _areaRenderer: PaneRendererAreaBaseline = new PaneRendererAreaBaseline();

	public constructor(series: Series<'AreaBaseline'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._areaRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const areaBaselineStyleProperties = this._series.options();

		this._makeValid();
		const data: PaneRendererAreaBaselineData = {
			lineType: areaBaselineStyleProperties.lineType,
			items: this._items,
			topLineColor: areaBaselineStyleProperties.topLineColor,
			bottomLineColor: areaBaselineStyleProperties.bottomLineColor,
			lineStyle: areaBaselineStyleProperties.lineStyle,
			lineWidth: areaBaselineStyleProperties.lineWidth,
			topFillColor1: areaBaselineStyleProperties.topFillColor1,
			topFillColor2: areaBaselineStyleProperties.topFillColor2,
			bottomFillColor1: areaBaselineStyleProperties.bottomFillColor1,
			bottomFillColor2: areaBaselineStyleProperties.bottomFillColor2,
			bottom: height as Coordinate,
			baseLine: this._series.priceScale().priceToCoordinate(areaBaselineStyleProperties.baseValue.price, 0),
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		this._areaRenderer.setData(data);

		return this._renderer;
	}

	protected _getBaselineCoordinate(baseValue: BaseValueType): Coordinate {
		return this._series.priceScale().priceToCoordinate(baseValue.price, 0);
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice): LineItem {
		return this._createRawItemBase(time, price);
	}
}
