import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { Series } from '../model/series';
import { LineSeriesOptions } from '../model/series-options';

import { ILineSeriesApi } from './iline-series-api';
import { LineSeriesApiBase } from './line-series-api-base';
import { DataUpdatesConsumer } from './series-api-base';

export class LineSeriesApi extends LineSeriesApiBase<'Line'> implements ILineSeriesApi {
	public constructor(series: Series<'Line'>, dataUpdatesConsumer: DataUpdatesConsumer<'Line'>) {
		super(series, dataUpdatesConsumer);
	}

	public applyOptions(options: DeepPartial<LineSeriesOptions>): void {
		this._series.applyOptions(options);
	}

	public options(): LineSeriesOptions {
		return clone(this._series.options());
	}
}
