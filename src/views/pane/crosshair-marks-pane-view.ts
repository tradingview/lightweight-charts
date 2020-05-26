import { ensureNotNull } from '../../helpers/assertions';

import { BarPrice } from '../../model/bar';
import { ChartModel, ChartOptionsInternal } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Crosshair } from '../../model/crosshair';
import { Series } from '../../model/series';
import { SeriesItemsIndexesRange, TimePointIndex } from '../../model/time-data';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { MarksRendererData, PaneRendererMarks } from '../../renderers/marks-renderer';

import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';

function createEmptyMarkerData(chartOptions: ChartOptionsInternal): MarksRendererData {
	return {
		items: [{
			x: 0 as Coordinate,
			y: 0 as Coordinate,
			time: 0 as TimePointIndex,
			price: 0 as BarPrice,
		}],
		lineColor: '',
		backColor: chartOptions.layout.backgroundColor,
		radius: 0,
		visibleRange: null,
	};
}

const rangeForSinglePoint: SeriesItemsIndexesRange = { from: 0, to: 1 };

export class CrosshairMarksPaneView implements IUpdatablePaneView {
	private readonly _chartModel: ChartModel;
	private readonly _crosshair: Crosshair;
	private readonly _compositeRenderer: CompositeRenderer = new CompositeRenderer();
	private _markersRenderers: PaneRendererMarks[] = [];
	private _markersData: MarksRendererData[] = [];
	private _invalidated: boolean = true;

	public constructor(chartModel: ChartModel, crosshair: Crosshair) {
		this._chartModel = chartModel;
		this._crosshair = crosshair;
		this._compositeRenderer.setRenderers(this._markersRenderers);
	}

	public update(updateType?: UpdateType): void {
		const serieses = this._chartModel.serieses();
		if (serieses.length !== this._markersRenderers.length) {
			this._markersData = serieses.map(() => createEmptyMarkerData(this._chartModel.options()));
			this._markersRenderers = this._markersData.map((data: MarksRendererData) => {
				const res = new PaneRendererMarks();
				res.setData(data);
				return res;
			});
			this._compositeRenderer.setRenderers(this._markersRenderers);
		}

		this._invalidated = true;
	}

	public renderer(height: number, width: number, addAnchors?: boolean): IPaneRenderer | null {
		if (this._invalidated) {
			this._updateImpl();
			this._invalidated = false;
		}

		return this._compositeRenderer;
	}

	private _updateImpl(): void {
		const serieses = this._chartModel.serieses();
		const timePointIndex = this._crosshair.appliedIndex();
		const timeScale = this._chartModel.timeScale();

		serieses.forEach((s: Series, index: number) => {
			const data = this._markersData[index];
			const seriesData = s.markerDataAtIndex(timePointIndex);

			if (seriesData === null) {
				data.visibleRange = null;
				return;
			}

			const firstValue = ensureNotNull(s.firstValue());
			data.lineColor = s.barColorer().barStyle(timePointIndex).barColor;
			data.backColor = this._chartModel.options().layout.backgroundColor;
			data.radius = seriesData.radius;
			data.items[0].price = seriesData.price;
			data.items[0].y = s.priceScale().priceToCoordinate(seriesData.price, firstValue.value);
			data.items[0].time = timePointIndex;
			data.items[0].x = timeScale.indexToCoordinate(timePointIndex);
			data.visibleRange = rangeForSinglePoint;
		});
	}
}
