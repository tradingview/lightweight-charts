import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { BackgroundShadeData } from '../data';

const DAY = 24 * 60 * 60;
const START = Date.UTC(2024, 0, 1) / 1000;

/** A daily random walk of candles, the same on every load. */
export function candleData(count: number): CandlestickData<UTCTimestamp>[] {
	const data: CandlestickData<UTCTimestamp>[] = [];
	let close = 100;
	for (let i = 0; i < count; i++) {
		const open = close;
		close = Math.round((open + Math.sin(i / 5) * 2 + Math.sin(i * 1.7) * 1.5) * 100) / 100;
		const high = Math.max(open, close) + 1 + Math.abs(Math.sin(i * 2.3));
		const low = Math.min(open, close) - 1 - Math.abs(Math.cos(i * 1.9));
		data.push({ time: (START + i * DAY) as UTCTimestamp, open, high, low, close });
	}
	return data;
}

/**
 * A 0–100 oscillator over the candles: the share of the last `period` bars
 * that closed up, the kind of value a background shade reads well.
 */
export function upShare(candles: CandlestickData<UTCTimestamp>[], period: number = 14): BackgroundShadeData[] {
	return candles.map((candle, index) => {
		const from = Math.max(0, index - period + 1);
		let up = 0;
		for (let i = from; i <= index; i++) {
			if (candles[i].close >= candles[i].open) {
				up++;
			}
		}
		return { time: candle.time, value: Math.round((up / (index - from + 1)) * 100) };
	});
}
