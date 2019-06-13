import {
	CandlestickSeriesPartialOptions,
	fillUpDownCandlesticksColors,
} from '../model/series-options';

import { SeriesApi } from './series-api';

export class CandlestickSeriesApi extends SeriesApi<'Candlestick'> {
	public applyOptions(options: CandlestickSeriesPartialOptions): void {
		fillUpDownCandlesticksColors(options);
		super.applyOptions(options);
	}
}
