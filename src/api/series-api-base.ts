import { IDestroyable } from '../helpers/idestroyable';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { Palette } from '../model/palette';
import { Series } from '../model/series';
import { SeriesType } from '../model/series-options';

import { TimedData } from './data-layer';
import { IPriceFormatter, ISeriesApi } from './iseries-api';

export interface DataUpdatesConsumer<TSeriesType extends SeriesType> {
	applyNewData(series: Series<TSeriesType>, data: TimedData[], palette?: Palette): void;
	updateData(series: Series<TSeriesType>, data: TimedData, palette?: Palette): void;
}

export abstract class SeriesApiBase<TSeriesType extends SeriesType> implements ISeriesApi, IDestroyable {
	protected _series: Series<TSeriesType>;
	protected _dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>;

	protected constructor(series: Series<TSeriesType>, dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>) {
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
		return this._series.priceScale().priceToCoordinate(price, firstValue);
	}
}
