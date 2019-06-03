import {
	CandleSeriesPartialOptions,
	fillUpDownCandlesColors,
} from '../model/series-options';

import { SeriesApi } from './series-api';

export class CandleSeriesApi extends SeriesApi<'Candle'> {
	public applyOptions(options: CandleSeriesPartialOptions): void {
		fillUpDownCandlesColors(options);
		super.applyOptions(options);
	}
}
