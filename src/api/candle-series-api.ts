import { DeepPartial } from '../helpers/strict-type-checks';

import { CandleSeriesOptions, fillUpDownCandlesColors } from '../model/series-options';

import { SeriesApi } from './series-api';

export class CandleSeriesApi extends SeriesApi<'Candle'> {
	public applyOptions(options: DeepPartial<CandleSeriesOptions>): void {
		fillUpDownCandlesColors(options);
		super.applyOptions(options);
	}
}
