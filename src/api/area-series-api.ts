import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { Series } from '../model/series';
import { AreaSeriesOptions } from '../model/series-options';

import { IAreaSeriesApi } from './iarea-series-api';
import { LineSeriesApiBase } from './line-series-api-base';
import { DataUpdatesConsumer } from './series-api-base';

export class AreaSeriesApi extends LineSeriesApiBase implements IAreaSeriesApi {
	public constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
		super(series, dataUpdatesConsumer);
	}

	public applyOptions(options: DeepPartial<AreaSeriesOptions>): void {
		this._series.applyOptions(options);
	}

	public options(): AreaSeriesOptions {
		return clone(this._series.options());
	}
}
