import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { BackgroundShadeData } from '../data';

const DAY = 24 * 60 * 60;
const START = Date.UTC(2024, 0, 1) / 1000;

/**
 * A pseudo-random number generator (mulberry32): the same seed gives the same
 * numbers, from 0 up to but not including 1, on every load.
 */
function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * A daily random walk of candles that trends up or down for a few weeks at a
 * time, so that runs of up-closing and down-closing bars come and go. The same
 * for the same seed.
 */
export function candleData(count: number, seed: number = 7): CandlestickData<UTCTimestamp>[] {
	const random = seededRandom(seed);
	const data: CandlestickData<UTCTimestamp>[] = [];
	let close = 100;
	let drift = 0;
	for (let i = 0; i < count; i++) {
		if (i % 20 === 0) {
			drift = (random() - 0.5) * 0.8;
		}
		const open = close;
		close = Math.round((open + drift + (random() - 0.5) * 3) * 100) / 100;
		const high = Math.round((Math.max(open, close) + random() * 1.5) * 100) / 100;
		const low = Math.round((Math.min(open, close) - random() * 1.5) * 100) / 100;
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
