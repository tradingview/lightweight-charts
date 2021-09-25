import { ensureNotNull } from '../../helpers/assertions';

import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Crosshair } from '../../model/crosshair';
import { IPriceDataSource } from '../../model/iprice-data-source';
import { Pane } from '../../model/pane';
import { Series } from '../../model/series';
import { SeriesItemsIndexesRange, TimePointIndex } from '../../model/time-data';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { MarksRendererData, PaneRendererMarks } from '../../renderers/marks-renderer';

import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';

function createEmptyMarkerData(): MarksRendererData {
	return {
		items: [{
			x: 0 as Coordinate,
			y: 0 as Coordinate,
			time: 0 as TimePointIndex,
			price: 0 as BarPrice,
		}],
		lineColor: '',
		backColor: '',
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
	private _validated: Map<Pane, PaneRendererMarks[]> = new Map();

	public constructor(chartModel: ChartModel, crosshair: Crosshair) {
		this._chartModel = chartModel;
		this._crosshair = crosshair;
		this._compositeRenderer.setRenderers(this._markersRenderers);
	}

	public update(updateType?: UpdateType): void {
		const serieses = this._chartModel.serieses();
		if (serieses.length !== this._markersRenderers.length) {
			this._markersData = serieses.map(createEmptyMarkerData);
			this._markersRenderers = this._markersData.map((data: MarksRendererData) => {
				const res = new PaneRendererMarks();
				res.setData(data);
				return res;
			});
			this._compositeRenderer.setRenderers(this._markersRenderers);
		}

		this._validated.clear();
	}

	public renderer(height: number, width: number, pane: Pane, addAnchors?: boolean): IPaneRenderer | null {
		let renderers = this._validated.get(pane);
		if (!renderers) {
			renderers = this._updateImpl(pane, height);
			this._validated.set(pane, renderers);
			const compositeRenderer = new CompositeRenderer();
			compositeRenderer.setRenderers(renderers);
			return compositeRenderer;
		}

		const compositeRenderer = new CompositeRenderer();
		compositeRenderer.setRenderers(renderers);
		return compositeRenderer;
		// return this._compositeRenderer;
	}

	private _updateImpl(pane: Pane, height: number): PaneRendererMarks[] {
		const serieses = this._chartModel.serieses()
			.map((datasource: IPriceDataSource, index: number): [Series, number] => [datasource as Series, index])
			.filter((entry: [IPriceDataSource, number]) => pane.dataSources().includes(entry[0]));

		const timePointIndex = this._crosshair.appliedIndex();
		const timeScale = this._chartModel.timeScale();

		return serieses.map(([s, index]: [Series, number]) => {
			const data = this._markersData[index];
			const seriesData = s.markerDataAtIndex(timePointIndex);

			if (seriesData === null || !s.visible()) {
				data.visibleRange = null;
			} else {
				const firstValue = ensureNotNull(s.firstValue());
				data.lineColor = seriesData.backgroundColor;
				data.radius = seriesData.radius;
				data.items[0].price = seriesData.price;
				data.items[0].y = s.priceScale().priceToCoordinate(seriesData.price, firstValue.value);
				data.backColor = seriesData.borderColor ?? this._chartModel.backgroundColorAtYPercentFromTop(data.items[0].y / height);
				data.items[0].time = timePointIndex;
				data.items[0].x = timeScale.indexToCoordinate(timePointIndex);
				data.visibleRange = rangeForSinglePoint;
			}
			return this._markersRenderers[index];
		});
	}
}
