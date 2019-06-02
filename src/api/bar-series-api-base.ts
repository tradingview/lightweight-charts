import { Series } from '../model/series';

import { BarData, IBarSeriesApiBase } from './ibar-series-api-base';
import { DataUpdatesConsumer, SeriesApiBase } from './series-api-base';

export class BarSeriesApiBase<TSeriesType extends 'Bar' | 'Candle'> extends SeriesApiBase<TSeriesType> implements IBarSeriesApiBase {
	protected constructor(series: Series<TSeriesType>, dataUpdatesConsumer: DataUpdatesConsumer<TSeriesType>) {
		super(series, dataUpdatesConsumer);
	}

	public setData(data: BarData[]): void {
		this._dataUpdatesConsumer.applyNewData(this._series, data);
	}

	public update(bar: BarData): void {
		this._dataUpdatesConsumer.updateData(this._series, bar);
	}
}
