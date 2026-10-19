import type { ScatterPoint } from '../data';

/** A small seeded random generator (mulberry32), so every page load draws the same data. */
export function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return (): number => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A normally distributed value, from two uniform ones (Box–Muller). */
function gaussian(random: () => number): number {
	const u = Math.max(1e-12, random());
	const v = random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** A closed trade: maximum adverse excursion against the realised result. */
export interface Trade extends ScatterPoint {
	/** Tooltip title, for the host. */
	title: string;
	/** Bars the position was held. */
	duration: number;
}

/** One cloud of trades: MAE 0–90 on X, PnL ±1M on Y, the duration as `sizeValue`. */
export function maeVsPnl(seed: number = 1, count: number = 180): Trade[] {
	const random = seededRandom(seed);
	const trades: Trade[] = [];
	for (let i = 0; i < count; i++) {
		const x = clamp(Math.pow(random(), 0.85) * 89, 0.3, 89);
		const y = clamp(gaussian(random) * 380_000 - 120_000 + x * 4_000, -950_000, 950_000);
		const duration = Math.round(1 + Math.pow(random(), 2.2) * 60);
		trades.push({ id: `trade-${i + 1}`, title: `Trade #${i + 1}`, x, y, sizeValue: duration, duration });
	}
	return trades;
}

/** Winning and losing trades as two groups, `win` and `loss`. */
export function winLossTrades(seed: number = 7, count: number = 170): Trade[] {
	const random = seededRandom(seed);
	const trades: Trade[] = [];
	for (let i = 0; i < count; i++) {
		const win = random() < 0.42;
		const x = win
			? clamp(5 + Math.abs(gaussian(random)) * 14, 0.5, 46)
			: clamp(18 + Math.abs(gaussian(random)) * 18, 1, 88);
		const y = win
			? clamp(350_000 + Math.abs(gaussian(random)) * 450_000, 80_000, 1_400_000)
			: -clamp(450_000 + Math.abs(gaussian(random)) * 350_000, 100_000, 1_400_000);
		const duration = Math.round(1 + Math.pow(random(), 2.5) * 60);
		trades.push({
			id: `trade-${i + 1}`,
			title: `Trade #${i + 1}`,
			group: win ? 'win' : 'loss',
			x,
			y,
			sizeValue: duration,
			duration,
		});
	}
	return trades;
}

/** A bond: maturity in years on X, yield in percent on Y, issue volume as `sizeValue`. */
export interface Bond extends ScatterPoint {
	/** Tooltip title, for the host. */
	title: string;
	/** Issue volume, billions. */
	volume: number;
}

const ratings = [
	{ id: 'aaa-aa', low: 2, high: 5.2 },
	{ id: 'a-bbb', low: 3.8, high: 7.2 },
	{ id: 'high-yield', low: 7.6, high: 11 },
];

/** Three rating groups of bonds, maturities 1–29 years, yields 2–11 %. */
export function bondMarket(seed: number = 3, perGroup: number = 24): Bond[] {
	const random = seededRandom(seed);
	const bonds: Bond[] = [];
	for (const rating of ratings) {
		for (let i = 0; i < perGroup; i++) {
			const x = 1 + random() * 28;
			const trend = (x / 30) * 0.8;
			const y = clamp(rating.low + random() * (rating.high - rating.low - 0.8) + trend, rating.low, rating.high);
			const volume = Math.round((0.5 + Math.pow(random(), 2) * 199.5) * 10) / 10;
			bonds.push({
				id: `${rating.id}-${i + 1}`,
				title: `PEMX${Math.floor(1_000_000 + random() * 8_999_999)}`,
				group: rating.id,
				x,
				y,
				sizeValue: volume,
				volume,
			});
		}
	}
	return bonds;
}

/** One week of a sector on a relative rotation graph. */
export interface RotationPoint extends ScatterPoint {
	/** Tooltip title, for the host. */
	title: string;
	/** Week number, 1 being the oldest. */
	week: number;
}

const sectors = [
	{ id: 'tech', x: 102.6, y: 100.6, heading: 2.2 },
	{ id: 'energy', x: 97.6, y: 99.0, heading: 4.2 },
	{ id: 'utilities', x: 98.2, y: 99.6, heading: 0.2 },
	{ id: 'health', x: 101.6, y: 99.2, heading: 3.0 },
];

/** Four sectors with ten-week tails, the last week (the head) drawn bigger. */
export function sectorRotation(seed: number = 5, weeks: number = 10): RotationPoint[] {
	const random = seededRandom(seed);
	const points: RotationPoint[] = [];
	for (const sector of sectors) {
		let { x, y, heading } = sector;
		for (let week = 1; week <= weeks; week++) {
			points.push({
				id: `${sector.id}-${week}`,
				title: `${sector.id} · week ${week}`,
				group: sector.id,
				x,
				y,
				week,
				size: week === weeks ? 13 : undefined,
			});
			// Rotate clockwise around (100, 100), with a little noise.
			heading -= 0.32 + random() * 0.18;
			const step = 0.45 + random() * 0.35;
			x = clamp(x + Math.cos(heading) * step, 96.3, 103.7);
			y = clamp(y + Math.sin(heading) * step, 96.3, 103.7);
		}
	}
	return points;
}

/** Many points in ten groups, for the 5000-point limit. */
export function largeDataset(seed: number = 11, groups: number = 10, perGroup: number = 500): ScatterPoint[] {
	const random = seededRandom(seed);
	const points: ScatterPoint[] = [];
	for (let g = 0; g < groups; g++) {
		const cx = 10 + random() * 80;
		const cy = 10 + random() * 80;
		for (let i = 0; i < perGroup; i++) {
			points.push({
				group: `g${g + 1}`,
				x: clamp(cx + gaussian(random) * 12, 0, 100),
				y: clamp(cy + gaussian(random) * 12, 0, 100),
				sizeValue: random(),
			});
		}
	}
	return points;
}
