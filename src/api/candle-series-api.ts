import { DeepPartial } from '../helpers/strict-type-checks';

import { Series } from '../model/series';
import { CandleSeriesOptions, fillUpDownCandlesColors } from '../model/series-options';

import { BarSeriesApiBase } from './bar-series-api-base';
import { ICandleSeries } from './icandle-series-api';
import { DataUpdatesConsumer } from './series-api-base';

export class CandleSeriesApi extends BarSeriesApiBase implements ICandleSeries {
	public constructor(series: Series, dataUpdatesConsumer: DataUpdatesConsumer) {
		super(series, dataUpdatesConsumer);
	}

	public applyOptions(options: DeepPartial<CandleSeriesOptions>): void {
		fillUpDownCandlesColors(options);
		this._series.applyOptions(options);
	}

	public options(): CandleSeriesOptions {
		return this._series.options();
	}
}
