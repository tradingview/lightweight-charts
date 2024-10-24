import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/series';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { BaselineFillItem, PaneRendererBaselineArea } from '../../renderers/baseline-renderer-area';
import { BaselineStrokeItem, PaneRendererBaselineLine } from '../../renderers/baseline-renderer-line';
import { CompositeRenderer } from '../../renderers/composite-renderer';

import { LinePaneViewBase } from './line-pane-view-base';

export class SeriesBaselinePaneView extends LinePaneViewBase<'Baseline', BaselineFillItem & BaselineStrokeItem, CompositeRenderer> {
	protected readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _baselineAreaRenderer: PaneRendererBaselineArea = new PaneRendererBaselineArea();
	private readonly _baselineLineRenderer: PaneRendererBaselineLine = new PaneRendererBaselineLine();

	public constructor(series: ISeries<'Baseline'>, model: IChartModelBase) {
		super(series, model);
		this._renderer.setRenderers([this._baselineAreaRenderer, this._baselineLineRenderer]);
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Baseline'>): BaselineFillItem & BaselineStrokeItem {
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

		const options = this._series.options();

		const baseLevelCoordinate = this._series.priceScale().priceToCoordinate(options.baseValue.price, firstValue.value);
		const barWidth = this._model.timeScale().barSpacing();

		this._baselineAreaRenderer.setData({
			items: this._items,

			lineWidth: options.lineWidth,
			lineStyle: options.lineStyle,
			lineType: options.lineType,

			baseLevelCoordinate,
			invertFilledArea: false,

			visibleRange: this._itemsVisibleRange,
			barWidth,
		});

		this._baselineLineRenderer.setData({
			items: this._items,

			lineWidth: options.lineWidth,
			lineStyle: options.lineStyle,
			lineType: options.lineVisible ? options.lineType : undefined,
			pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,

			baseLevelCoordinate,

			visibleRange: this._itemsVisibleRange,
			barWidth,
		});
	}
}
