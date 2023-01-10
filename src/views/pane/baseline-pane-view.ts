import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Series } from '../../model/series';
import { SeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { BaselineFillItem, PaneRendererBaselineArea } from '../../renderers/baseline-renderer-area';
import { BaselineStrokeItem, PaneRendererBaselineLine } from '../../renderers/baseline-renderer-line';
import { CompositeRenderer } from '../../renderers/composite-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesBaselinePaneView extends LinePaneViewBase<'Baseline', BaselineFillItem & BaselineStrokeItem, CompositeRenderer> {
	protected readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _baselineAreaRenderer: PaneRendererBaselineArea = new PaneRendererBaselineArea();
	private readonly _baselineLineRenderer: PaneRendererBaselineLine = new PaneRendererBaselineLine();

	public constructor(series: Series<'Baseline'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._baselineAreaRenderer, this._baselineLineRenderer]);
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: SeriesBarColorer<'Baseline'>): BaselineFillItem & BaselineStrokeItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}

	protected _prepareRendererData(): void {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}

		const baselineProps = this._series.options();

		const baseLevelCoordinate = this._series.priceScale().priceToCoordinate(baselineProps.baseValue.price, firstValue.value);
		const barWidth = this._model.timeScale().barSpacing();

		this._baselineAreaRenderer.setData({
			items: this._items,

			lineWidth: baselineProps.lineWidth,
			lineStyle: baselineProps.lineStyle,
			lineType: baselineProps.lineType,

			baseLevelCoordinate,
			invertFilledArea: false,

			visibleRange: this._itemsVisibleRange,
			barWidth,
		});

		this._baselineLineRenderer.setData({
			items: this._items,

			lineWidth: baselineProps.lineWidth,
			lineStyle: baselineProps.lineStyle,
			lineType: baselineProps.lineType,

			baseLevelCoordinate,

			visibleRange: this._itemsVisibleRange,
			barWidth,
		});
	}
}
