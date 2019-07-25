import { IDestroyable } from '../helpers/idestroyable';
import { clone } from '../helpers/strict-type-checks';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { Series } from '../model/series';
import { SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';

import { DataUpdatesConsumer, SeriesDataItemTypeMap, Time } from './data-consumer';
import { convertTime } from './data-layer';
import { IPriceFormatter, ISeriesApi } from './iseries-api';

export class SeriesApi<TSeriesType extends SeriesType> implements ISeriesApi<TSeriesType>, IDestroyable {
	protected _series: Series<TSeriesType>;
	protected _dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>;

	public constructor(series: Series<TSeriesType>, dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>) {
		this._series = series;
		this._dataUpdatesConsumer = dataUpdatesConsumer;
	}

	public destroy(): void {
		delete this._series;
		delete this._dataUpdatesConsumer;
	}

	public priceFormatter(): IPriceFormatter {
		return this._series.formatter();
	}

	public series(): Series<TSeriesType> {
		return this._series;
	}

	public priceToCoordinate(price: BarPrice): Coordinate | null {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}

		return this._series.priceScale().priceToCoordinate(price, firstValue.value);
	}

	public setData(data: SeriesDataItemTypeMap[TSeriesType][]): void {
		this._dataUpdatesConsumer.applyNewData(this._series, data);
	}

	public update(bar: SeriesDataItemTypeMap[TSeriesType]): void {
		this._dataUpdatesConsumer.updateData(this._series, bar);
	}

	public setMarkers(data: SeriesMarker<Time>[]): void {
		const convertedMarkers = data.map((marker: SeriesMarker<Time>) => ({
			...marker,
			time: convertTime(marker.time),
		}));
		this._series.setMarkers(convertedMarkers);
	}

	public applyOptions(options: SeriesPartialOptionsMap[TSeriesType]): void {
		this._series.applyOptions(options);
	}

	public options(): Readonly<SeriesOptionsMap[TSeriesType]> {
		return clone(this._series.options());
	}
}
