import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { Series } from '../model/series';
import { CandleSeriesOptions, fillUpDownCandlesColors } from '../model/series-options';

import { BarSeriesApiBase } from './bar-series-api-base';
import { ICandleSeries } from './icandle-series-api';
import { DataUpdatesConsumer } from './series-api-base';

export class CandleSeriesApi extends BarSeriesApiBase<'Candle'> implements ICandleSeries {
	public constructor(series: Series<'Candle'>, dataUpdatesConsumer: DataUpdatesConsumer<'Candle'>) {
		super(series, dataUpdatesConsumer);
	}

	public applyOptions(options: DeepPartial<CandleSeriesOptions>): void {
		fillUpDownCandlesColors(options);
		this._series.applyOptions(options);
	}

	public options(): CandleSeriesOptions {
		return clone(this._series.options());
	}
}
