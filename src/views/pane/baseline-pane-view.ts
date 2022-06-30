import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { BaselineFillItem, BaselineStrokeItem, PaneRendererBaselineArea, PaneRendererBaselineLine } from '../../renderers/baseline-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesBaselinePaneView extends LinePaneViewBase<'Baseline', BaselineFillItem & BaselineStrokeItem> {
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

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer<'Baseline'>): BaselineFillItem & BaselineStrokeItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}
}
