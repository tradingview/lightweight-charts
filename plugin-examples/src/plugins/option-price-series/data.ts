import {
	CandlestickData,
	CustomData,
} from 'lightweight-charts';

export interface OptionPriceSeriesData
	extends CandlestickData,
		CustomData {
	strike: number;
	expiry: Date;
	price: number;
	isCall: boolean;
}
