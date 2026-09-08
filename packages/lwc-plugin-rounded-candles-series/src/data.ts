import {
	CandlestickData,
	CustomData,
	Time,
} from 'lightweight-charts';

/**
 * Rounded candle series data
 */
export interface RoundedCandleData<HorzScaleItem = Time>
	extends CandlestickData<HorzScaleItem>,
		CustomData<HorzScaleItem> {}

/** @deprecated Use RoundedCandleData. */
export type RoundedCandleSeriesData<H = Time> = RoundedCandleData<H>;
