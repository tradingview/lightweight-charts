import { LineData, UTCTimestamp } from 'lightweight-charts';
import { HeatmapCell, HeatmapData } from '../data';

const MINUTE = 60;
const DAY = 24 * 60 * MINUTE;
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

/** A daily price wandering around 100, the same for the same seed. */
export function priceData(count: number, seed: number = 1): LineData<UTCTimestamp>[] {
	const random = seededRandom(seed);
	const data: LineData<UTCTimestamp>[] = [];
	let value = 100;
	for (let i = 0; i < count; i++) {
		value += (random() - 0.5) * 3 + Math.sin(i / 12) * 0.6;
		data.push({ time: (START + i * DAY) as UTCTimestamp, value: Math.round(value * 100) / 100 });
	}
	return data;
}

/**
 * A bell-shaped column of cells around each price, `binSize` apart, with
 * amounts from 0 to about 100, like the volume traded at each price level.
 */
export function profileData(prices: readonly LineData<UTCTimestamp>[], seed: number = 2, spread: number = 6, binSize: number = 2): HeatmapData[] {
	const random = seededRandom(seed);
	return prices.map((point): HeatmapData => {
		const cells: HeatmapCell[] = [];
		const first = Math.floor((point.value - spread * 3) / binSize) * binSize;
		for (let low = first; low < point.value + spread * 3; low += binSize) {
			const distance = (low + binSize / 2 - point.value) / spread;
			const noise = 0.75 + random() * 0.5;
			cells.push({ low, high: low + binSize, amount: Math.round(100 * Math.exp(-distance * distance / 2) * noise) });
		}
		return { time: point.time, cells };
	});
}

/** An order book through time: the mid price, and the resting size at each price level. */
export interface OrderBookSample {
	/** The mid price, one point a minute. */
	mid: LineData<UTCTimestamp>[];
	/** The size resting at each price level around the mid price, one column a minute. */
	book: HeatmapData[];
}

/** A large resting order, standing at one price until the price trades through it. */
interface Wall {
	price: number;
	/** Whether it rests above the price, an offer, or below, a bid. */
	above: boolean;
	from: number;
	to: number;
	size: number;
}

/**
 * A minute-by-minute order book, `levels` price levels either side of the mid
 * price, `tick` apart: a thin book near the price, thicker further out, and
 * large orders that rest at one level for a while and are taken out when the
 * price trades through them. The same for the same seed.
 */
export function orderBookData(count: number, seed: number = 3, levels: number = 40, tick: number = 0.5): OrderBookSample {
	const random = seededRandom(seed);
	const walls: Wall[] = [];
	const mid: LineData<UTCTimestamp>[] = [];
	const book: HeatmapData[] = [];
	let price = 100;
	for (let i = 0; i < count; i++) {
		price += (random() - 0.5) * 0.9 + Math.sin(i / 25) * 0.08;
		const time = (START + i * MINUTE) as UTCTimestamp;
		mid.push({ time, value: Math.round(price * 100) / 100 });
		for (const wall of walls) {
			// A wall the price trades through has been filled, and is gone.
			if (i < wall.to && wall.above !== wall.price > price) {
				wall.to = i;
			}
		}
		if (random() < 0.12) {
			const above = random() < 0.5;
			const offset = Math.round(4 + random() * (levels - 8));
			const level = Math.round(price / tick) + (above ? offset : -offset);
			walls.push({ price: level * tick, above, from: i, to: i + 20 + Math.round(random() * 60), size: 50 + random() * 50 });
		}
		const center = Math.round(price / tick);
		const cells: HeatmapCell[] = [];
		for (let level = center - levels; level < center + levels; level++) {
			const low = level * tick;
			const distance = Math.abs(low + tick / 2 - price);
			let amount = 4 + 18 * (1 - Math.exp(-distance / 2)) * Math.exp(-distance / 30) + random() * 6;
			for (const wall of walls) {
				if (wall.price === low && i >= wall.from && i < wall.to) {
					amount += wall.size;
				}
			}
			cells.push({ low, high: low + tick, amount: Math.round(amount) });
		}
		book.push({ time, cells });
	}
	return { mid, book };
}

/** The turbo color map, from dark blue at 0 through green to dark red at 1. */
export function turboColor(t: number): string {
	t = Math.max(0, Math.min(1, t));
	const r = Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))));
	const g = Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))));
	const b = Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))));
	return `rgb(${r}, ${g}, ${b})`;
}
