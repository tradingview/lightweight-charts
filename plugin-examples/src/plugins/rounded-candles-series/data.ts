import {
	CandlestickData,
	CustomData,
} from 'lightweight-charts';

export interface RoundedCandleSeriesData
	extends CandlestickData,
		CustomData {
	rounded?: boolean;
}
