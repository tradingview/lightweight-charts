import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/iseries';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { BaselineFillItem, PaneRendererBaselineArea } from '../../renderers/baseline-renderer-area';
import { BaselineStrokeItem, PaneRendererBaselineLine } from '../../renderers/baseline-renderer-line';
import { HoveredSourcePaneViews } from '../../views/pane/hovered-source-pane-views';
import { IPaneView } from '../../views/pane/ipane-view';

import { FillSeriesCompositeRenderer, FillSeriesLinePaneView } from './fill-series-hovered-pane-view';
import { LineHitTestPaneViewBase } from './line-hit-test-pane-view-base';

export class SeriesBaselinePaneView extends LineHitTestPaneViewBase<'Baseline', BaselineFillItem & BaselineStrokeItem, FillSeriesCompositeRenderer> {
	protected readonly _renderer: FillSeriesCompositeRenderer;
	private readonly _baselineAreaRenderer: PaneRendererBaselineArea = new PaneRendererBaselineArea();
	private readonly _baselineLineRenderer: PaneRendererBaselineLine = new PaneRendererBaselineLine();
	private readonly _linePaneView: FillSeriesLinePaneView = new FillSeriesLinePaneView(
		this._baselineLineRenderer,
		() => this._series.visible() && this._itemsVisibleRange !== null && this._hasVisibleLineLikeContent()
	);
	private readonly _normalPaneViews: readonly IPaneView[] = [this];
	private readonly _topPaneViews: readonly IPaneView[] = [this._linePaneView];
	private readonly _hoveredSourcePaneViews: HoveredSourcePaneViews = {
		normalPaneViews: this._normalPaneViews,
		topPaneViews: this._topPaneViews,
	};

	public constructor(series: ISeries<'Baseline'>, model: IChartModelBase) {
		super(series, model);
		this._renderer = new FillSeriesCompositeRenderer(
			this._baselineAreaRenderer,
			this._baselineLineRenderer,
			() => this._model.options().hoveredSeriesOnTop
		);
	}

	public paneViewsForHoveredSourceOnTop(): HoveredSourcePaneViews | null {
		return this._hoveredSourcePaneViews;
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

		if (this._itemsVisibleRange === null || this._items.length === 0) {
			return;
		}
		let topCoordinate;
		let bottomCoordinate;

		if (options.relativeGradient) {
			topCoordinate = this._items[this._itemsVisibleRange.from].y;
			bottomCoordinate = this._items[this._itemsVisibleRange.from].y;

			for (let i = this._itemsVisibleRange.from; i < this._itemsVisibleRange.to; i++) {
				const item = this._items[i];
				if (item.y < topCoordinate) {
					topCoordinate = item.y;
				}
				if (item.y > bottomCoordinate) {
					bottomCoordinate = item.y;
				}
			}
		}

		this._baselineAreaRenderer.setData({
			items: this._items,
			lineWidth: options.lineWidth,
			lineStyle: options.lineStyle,
			lineType: options.lineType,
			baseLevelCoordinate,
			topCoordinate,
			bottomCoordinate,
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
			topCoordinate,
			bottomCoordinate,
			visibleRange: this._itemsVisibleRange,
			barWidth,
		});
	}

	private _hasVisibleLineLikeContent(): boolean {
		const options = this._series.options();
		return options.lineVisible || options.pointMarkersVisible;
	}
}
