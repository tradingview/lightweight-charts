import { BarPrice } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { ISeries } from '../../model/iseries';
import { ISeriesBarColorer } from '../../model/series-bar-colorer';
import { TimePointIndex } from '../../model/time-data';
import { AreaFillItem, PaneRendererArea } from '../../renderers/area-renderer';
import { LineStrokeItem, PaneRendererLine } from '../../renderers/line-renderer';
import { HoveredSourcePaneViews } from '../../views/pane/hovered-source-pane-views';
import { IPaneView } from '../../views/pane/ipane-view';

import { FillSeriesCompositeRenderer, FillSeriesLinePaneView } from './fill-series-hovered-pane-view';
import { LineHitTestPaneViewBase } from './line-hit-test-pane-view-base';

export class SeriesAreaPaneView extends LineHitTestPaneViewBase<'Area', AreaFillItem & LineStrokeItem, FillSeriesCompositeRenderer> {
	protected readonly _renderer: FillSeriesCompositeRenderer;
	private readonly _areaRenderer: PaneRendererArea = new PaneRendererArea();
	private readonly _lineRenderer: PaneRendererLine = new PaneRendererLine();
	private readonly _linePaneView: FillSeriesLinePaneView = new FillSeriesLinePaneView(
		this._lineRenderer,
		() => this._series.visible() && this._itemsVisibleRange !== null && this._hasVisibleLineLikeContent()
	);
	private readonly _normalPaneViews: readonly IPaneView[] = [this];
	private readonly _topPaneViews: readonly IPaneView[] = [this._linePaneView];
	private readonly _hoveredSourcePaneViews: HoveredSourcePaneViews = {
		normalPaneViews: this._normalPaneViews,
		topPaneViews: this._topPaneViews,
	};

	public constructor(series: ISeries<'Area'>, model: IChartModelBase) {
		super(series, model);
		this._renderer = new FillSeriesCompositeRenderer(
			this._areaRenderer,
			this._lineRenderer,
			() => this._model.options().hoveredSeriesOnTop
		);
	}

	public paneViewsForHoveredSourceOnTop(): HoveredSourcePaneViews | null {
		return this._hoveredSourcePaneViews;
	}

	protected _createRawItem(time: TimePointIndex, price: BarPrice, colorer: ISeriesBarColorer<'Area'>): AreaFillItem & LineStrokeItem {
		return {
			...this._createRawItemBase(time, price),
			...colorer.barStyle(time),
		};
	}

	protected _prepareRendererData(): void {
		const options = this._series.options();
		if (this._itemsVisibleRange === null || this._items.length === 0) {
			return;
		}
		let topCoordinate;

		if (options.relativeGradient) {
			topCoordinate = this._items[this._itemsVisibleRange.from].y;

			for (let i = this._itemsVisibleRange.from; i < this._itemsVisibleRange.to; i++) {
				const item = this._items[i];
				if (item.y < topCoordinate) {
					topCoordinate = item.y;
				}
			}
		}
		this._areaRenderer.setData({
			lineType: options.lineType,
			items: this._items,
			lineStyle: options.lineStyle,
			lineWidth: options.lineWidth,
			baseLevelCoordinate: null,
			topCoordinate,
			invertFilledArea: options.invertFilledArea,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		});

		this._lineRenderer.setData({
			lineType: options.lineVisible ? options.lineType : undefined,
			items: this._items,
			lineStyle: options.lineStyle,
			lineWidth: options.lineWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
			pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
		});
	}

	private _hasVisibleLineLikeContent(): boolean {
		const options = this._series.options();
		return options.lineVisible || options.pointMarkersVisible;
	}
}
