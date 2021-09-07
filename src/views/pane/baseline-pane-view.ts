import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { BaseValueType } from '../../model/series-options';
import { TimePointIndex } from '../../model/time-data';
import { PaneRendererBaseline, PaneRendererBaselineData } from '../../renderers/baseline-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesBaselinePaneView extends LinePaneViewBase<'Baseline', LineItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _areaRenderer: PaneRendererBaseline = new PaneRendererBaseline();

	public constructor(series: Series<'Baseline'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._areaRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const baselineProps = this._series.options();

		this._makeValid();
		const data: PaneRendererBaselineData = {
			lineType: baselineProps.lineType,
			items: this._items,
			topLineColor: baselineProps.topLineColor,
			bottomLineColor: baselineProps.bottomLineColor,
			lineStyle: baselineProps.lineStyle,
			lineWidth: baselineProps.lineWidth,
			topFillColor1: baselineProps.topFillColor1,
			topFillColor2: baselineProps.topFillColor2,
			bottomFillColor1: baselineProps.bottomFillColor1,
			bottomFillColor2: baselineProps.bottomFillColor2,
			bottom: height as Coordinate,
			baseLine: this._series.priceScale().priceToCoordinate(baselineProps.baseValue.price, 0),
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
