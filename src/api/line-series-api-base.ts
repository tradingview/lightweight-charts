import { Series } from '../model/series';

import { ILineSeriesApiBase, LineData } from './iline-series-api-base';
import { DataUpdatesConsumer, SeriesApiBase } from './series-api-base';

export abstract class LineSeriesApiBase extends SeriesApiBase implements ILineSeriesApiBase {
	protected constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
		super(series, dataUpdatesConsumer);
	}

	public setData(data: LineData[]): void {
		this._dataUpdatesConsumer.applyNewData(this._series, data);
	}

	public update(bar: LineData): void {
		this._dataUpdatesConsumer.updateData(this._series, bar);
	}
}
