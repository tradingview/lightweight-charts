import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { TimePointIndex } from '../../model/time-data';
import { PaneRendererBaselineArea, PaneRendererBaselineLine } from '../../renderers/baseline-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem } from '../../renderers/line-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesBaselinePaneView extends LinePaneViewBase<'Baseline', LineItem> {
	private readonly _baselineAreaRenderer: PaneRendererBaselineArea = new PaneRendererBaselineArea();
	private readonly _baselineLineRenderer: PaneRendererBaselineLine = new PaneRendererBaselineLine();
	private readonly _compositeRenderer: CompositeRenderer = new CompositeRenderer();

	public constructor(series: Series<'Baseline'>, model: ChartModel) {
		super(series, model);
		this._compositeRenderer.setRenderers([this._baselineAreaRenderer, this._baselineLineRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}

		const baselineProps = this._series.options();

		this._makeValid();

		const baseLevelCoordinate = this._series.priceScale().priceToCoordinate(baselineProps.baseValue.price, firstValue.value);
		const barWidth = this._model.timeScale().barSpacing();

		this._baselineAreaRenderer.setData({
			items: this._items,

			topFillColor1: baselineProps.topFillColor1,
			topFillColor2: baselineProps.topFillColor2,
			bottomFillColor1: baselineProps.bottomFillColor1,
			bottomFillColor2: baselineProps.bottomFillColor2,

			lineWidth: baselineProps.lineWidth,
			lineStyle: baselineProps.lineStyle,
			lineType: baselineProps.lineType,

			baseLevelCoordinate,
			bottom: height as Coordinate,

			visibleRange: this._itemsVisibleRange,
			barWidth,
		});

		this._baselineLineRenderer.setData({
			items: this._items,

			topColor: baselineProps.topLineColor,
			bottomColor: baselineProps.bottomLineColor,

			lineWidth: baselineProps.lineWidth,
			lineStyle: baselineProps.lineStyle,
			lineType: baselineProps.lineType,

			baseLevelCoordinate,
			bottom: height as Coordinate,

			visibleRange: this._itemsVisibleRange,
			barWidth,
		});

		return this._compositeRenderer;
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice): LineItem {
		return this._createRawItemBase(time, price);
	}
}
