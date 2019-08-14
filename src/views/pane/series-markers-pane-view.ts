import { isNumber } from '../../helpers/strict-type-checks';

import { AutoScaleMargins } from '../../model/autoscale-info';
import { BarPrice, BarPrices } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { InternalSeriesMarker, SeriesMarker } from '../../model/series-markers';
import { TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { SeriesMarkerRendererData, SeriesMarkersRenderer } from '../../renderers/series-markers-renderer';
import {
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
} from '../../renderers/series-markers-utils';

import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';

interface Offsets {
	aboveBar: number;
	belowBar: number;
}

function calcuateY(
	// tslint:disable-next-line:max-params
	marker: SeriesMarker<TimePointIndex>,
	seriesData: BarPrices | BarPrice,
	offsets: Offsets,
	shapeMargin: number,
	priceScale: PriceScale,
	timeScale: TimeScale,
	firstValue: number
): Coordinate {
	const inBarPrice = isNumber(seriesData) ? seriesData : seriesData.close;
	const highPrice = isNumber(seriesData) ? seriesData : seriesData.high;
	const lowPrice = isNumber(seriesData) ? seriesData : seriesData.low;
	const shapeSize = calculateShapeHeight(timeScale.barSpacing());
	let res: Coordinate = 0 as Coordinate;
	switch (marker.position) {
		case 'inBar': {
			res = priceScale.priceToCoordinate(inBarPrice, firstValue);
			break;
		}
		case 'aboveBar': {
			res = (priceScale.priceToCoordinate(highPrice, firstValue) - shapeSize / 2 - offsets.aboveBar) as Coordinate;
			offsets.aboveBar += shapeSize + shapeMargin;
			break;
		}
		case 'belowBar': {
			res = (priceScale.priceToCoordinate(lowPrice, firstValue) + shapeSize / 2 + offsets.belowBar) as Coordinate;
			offsets.belowBar += shapeSize + shapeMargin;
			break;
		}
	}
	return res;
}

export class SeriesMarkersPaneView implements IUpdatablePaneView {
	private readonly _series: Series;
	private readonly _model: ChartModel;
	private _data: SeriesMarkerRendererData;

	private _invalidated: boolean = true;
	private _dataInvalidated: boolean = true;

	private _autoScaleMargins: AutoScaleMargins | null = null;

	private _renderer: SeriesMarkersRenderer = new SeriesMarkersRenderer();

	public constructor(series: Series, model: ChartModel) {
		this._series = series;
		this._model = model;
		this._data = {
			items: [],
			visibleRange: null,
			barSpacing: 0,
		};
	}

	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		if (updateType === 'data') {
			this._dataInvalidated = true;
		}
	}

	public renderer(height: number, width: number, addAnchors?: boolean): IPaneRenderer {
		if (this._invalidated) {
			this._makeValid();
		}
		this._renderer.setData(this._data);
		return this._renderer;
	}

	public autoScaleMargins(): AutoScaleMargins | null {
		if (this._invalidated) {
			this._makeValid();
		}

		return this._autoScaleMargins;
	}

	protected _makeValid(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesMarkers = this._series.indexedMarkers();
		if (this._dataInvalidated) {
			this._data.items = seriesMarkers.map((marker: InternalSeriesMarker<TimePointIndex>) => ({
				time: marker.time,
				x: 0 as Coordinate,
				y: 0 as Coordinate,
				shape: marker.shape,
				color: marker.color,
				internalId: marker.internalId,
				externalId: marker.id,
			}));
			this._dataInvalidated = false;
		}

		const shapeMargin = calculateShapeMargin(timeScale.barSpacing());
		if (seriesMarkers.length > 0) {
			const marginsAboveAndBelow = calculateShapeHeight(timeScale.barSpacing()) * 1.5 + shapeMargin * 2;
			this._autoScaleMargins = {
				above: marginsAboveAndBelow as Coordinate,
				below: marginsAboveAndBelow as Coordinate,
			};
		} else {
			this._autoScaleMargins = null;
		}

		this._data.visibleRange = null;
		const visibleBars = timeScale.visibleBars();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		let prevTimeIndex = NaN;
		const offsets: Offsets = {
			aboveBar: shapeMargin,
			belowBar: shapeMargin,
		};
		this._data.visibleRange = visibleTimedValues(this._data.items, visibleBars, true);
		this._data.barSpacing = timeScale.barSpacing();
		for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
			const marker = seriesMarkers[index];
			if (marker.time !== prevTimeIndex) {
				// new bar, reset stack counter
				offsets.aboveBar = shapeMargin;
				offsets.belowBar = shapeMargin;
				prevTimeIndex = marker.time;
			}
			this._data.items[index].x = timeScale.indexToCoordinate(marker.time);
			const dataAt = this._series.dataAt(marker.time);
			if (dataAt === null) {
				continue;
			}
			this._data.items[index].y = calcuateY(marker, dataAt, offsets, shapeMargin, priceScale, timeScale, firstValue.value);
		}
		this._invalidated = false;
	}
}
