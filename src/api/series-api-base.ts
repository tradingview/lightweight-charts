import { IDestroyable } from '../helpers/idestroyable';

import { BarPrice } from '../model/bar';
import { Coordinate } from '../model/coordinate';
import { Palette } from '../model/palette';
import { Series } from '../model/series';

import { TimedData } from './data-layer';
import { IPriceFormatter, ISeriesApi } from './iseries-api';

export interface DataUpdatesConsumer {
	applyNewData(series: Series, data: TimedData[], palette?: Palette): void;
	updateData(series: Series, data: TimedData, palette?: Palette): void;
}

export abstract class SeriesApiBase implements ISeriesApi, IDestroyable {
	protected _series: Series;
	protected _dataUpdatesConsumer: DataUpdatesConsumer;

	protected constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
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

	public series(): Series {
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
