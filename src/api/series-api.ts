import { IDestroyable } from '../helpers/idestroyable';
import { clone, merge } from '../helpers/strict-type-checks';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { PriceLineOptions } from '../model/price-line-options';
import { Series, SeriesPartialOptionsInternal } from '../model/series';
import { SeriesMarker } from '../model/series-markers';
import {
	SeriesOptionsMap,
	SeriesPartialOptionsMap,
	SeriesType,
} from '../model/series-options';

import { IPriceScaleApiProvider } from './chart-api';
import { DataUpdatesConsumer, SeriesDataItemTypeMap, Time } from './data-consumer';
import { convertTime } from './data-layer';
import { IPriceLine } from './iprice-line';
import { IPriceScaleApi } from './iprice-scale-api';
import { IPriceFormatter, ISeriesApi } from './iseries-api';
import { priceLineOptionsDefaults } from './options/price-line-options-defaults';
import { PriceLine } from './price-line-api';

function migrateOptions<TSeriesType extends SeriesType>(options: SeriesPartialOptionsMap[TSeriesType]): SeriesPartialOptionsInternal<TSeriesType> {
	// tslint:disable-next-line:deprecation
	const { overlay, ...res } = options;
	if (overlay) {
		res.priceScaleId = '';
	}
	return res;
}

export class SeriesApi<TSeriesType extends SeriesType> implements ISeriesApi<TSeriesType>, IDestroyable {
	protected _series: Series<TSeriesType>;
	protected _dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>;

	private readonly _priceScaleApiProvider: IPriceScaleApiProvider;

	public constructor(series: Series<TSeriesType>, dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>, priceScaleApiProvider: IPriceScaleApiProvider) {
		this._series = series;
		this._dataUpdatesConsumer = dataUpdatesConsumer;
		this._priceScaleApiProvider = priceScaleApiProvider;
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

	public coordinateToPrice(coordinate: Coordinate): BarPrice | null {
		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return null;
		}
		return this._series.priceScale().coordinateToPrice(coordinate, firstValue.value);
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
		const migratedOptions = migrateOptions(options);
		this._series.applyOptions(migratedOptions);
	}

	public options(): Readonly<SeriesOptionsMap[TSeriesType]> {
		return clone(this._series.options());
	}

	public priceScale(): IPriceScaleApi {
		return this._priceScaleApiProvider.priceScale(this._series.priceScale().id());
	}

	public createPriceLine(options: PriceLineOptions): IPriceLine {
		const strictOptions = merge(clone(priceLineOptionsDefaults), options) as PriceLineOptions;
		const priceLine = this._series.createPriceLine(strictOptions);
		return new PriceLine(priceLine);
	}

	public removePriceLine(line: IPriceLine): void {
		this._series.removePriceLine((line as PriceLine).priceLine());
	}
}
