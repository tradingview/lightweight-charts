import {
	CandlestickSeriesPartialOptions,
	fillUpDownCandlesticksColors,
} from '../model/series-options';

import { SeriesApi } from './series-api';

export class CandlestickSeriesApi<HorzScaleItem> extends SeriesApi<'Candlestick', HorzScaleItem> {
	public override applyOptions(options: CandlestickSeriesPartialOptions): void {
		fillUpDownCandlesticksColors(options);
		super.applyOptions(options);
	}
}
