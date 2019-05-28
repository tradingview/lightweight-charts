import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { Series } from '../model/series';
import { BarSeriesOptions } from '../model/series-options';

import { BarSeriesApiBase } from './bar-series-api-base';
import { IBarSeriesApi } from './ibar-series-api';
import { DataUpdatesConsumer } from './series-api-base';

export class BarSeriesApi extends BarSeriesApiBase implements IBarSeriesApi {
	public constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
		super(series, dataUpdatesConsumer);
	}

	public applyOptions(options: DeepPartial<BarSeriesOptions>): void {
		this._series.applyOptions(options);
	}

	public options(): BarSeriesOptions {
		return clone(this._series.options());
	}
}
