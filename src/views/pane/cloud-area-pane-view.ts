import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
import { TimePointIndex } from '../../model/time-data';
import { CloudLineItem, PaneRendererCloudArea, PaneRendererCloudAreaData } from '../../renderers/cloud-area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { LineItem, PaneRendererLine, PaneRendererLineData } from '../../renderers/line-renderer';

import { CloudAreaPaneViewBase } from './cloud-area-pane-view-base';

export class SeriesCloudAreaPaneView extends CloudAreaPaneViewBase<'CloudArea', CloudLineItem> {
	private readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _cloudAreaRenderer: PaneRendererCloudArea = new PaneRendererCloudArea();
	private readonly _higherRenderer: PaneRendererLine = new PaneRendererLine();
	private readonly _lowerRenderer: PaneRendererLine = new PaneRendererLine();

	public constructor(series: Series<'CloudArea'>, model: ChartModel) {
		super(series, model);
		this._renderer.setRenderers([this._cloudAreaRenderer, this._higherRenderer, this._lowerRenderer]);
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		const areaStyleProperties = this._series.options();

		this._makeValid();
		const cloudRendererData: PaneRendererCloudAreaData = {
			items: this._items,
			positiveColor: areaStyleProperties.positiveColor,
			negativeColor: areaStyleProperties.negativeColor,
			bottom: height as Coordinate,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		const higherLineData: LineItem[] = [];
		for (let i = 0; i < this._items.length; i++) {
			const temp: LineItem = {
				time: this._items[i].time,
				price: this._items[i].higherPrice,
				x: this._items[i].x,
				y: this._items[i].higherY,
			};
			higherLineData.push(temp);
		}

		const higherRendererLineData: PaneRendererLineData = {
			items: higherLineData,
			lineColor: areaStyleProperties.higherLineColor,
			lineStyle: areaStyleProperties.higherLineStyle,
			lineType: areaStyleProperties.higherLineType,
			lineWidth: areaStyleProperties.higherLineWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		const lowerLineData: LineItem[] = [];
		for (let i = 0; i < this._items.length; i++) {
			const temp: LineItem = {
				time: this._items[i].time,
				price: this._items[i].lowerPrice,
				x: this._items[i].x,
				y: this._items[i].lowerY,
			};
			lowerLineData.push(temp);
		}

		const lowerRendererLineData: PaneRendererLineData = {
			items: lowerLineData,
			lineColor: areaStyleProperties.lowerLineColor,
			lineStyle: areaStyleProperties.lowerLineStyle,
			lineType: areaStyleProperties.lowerLineType,
			lineWidth: areaStyleProperties.lowerLineWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		this._cloudAreaRenderer.setData(cloudRendererData);
		this._higherRenderer.setData(higherRendererLineData);
		this._lowerRenderer.setData(lowerRendererLineData);

		return this._renderer;
	}

	protected _createRawItem(time: TimePointIndex, higherPrice: BarPrice, lowerPrice: BarPrice): CloudLineItem {
		return this._createRawItemBase(time, higherPrice, lowerPrice);
	}
}
