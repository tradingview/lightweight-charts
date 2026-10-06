import type { Time } from 'lightweight-charts';

export type CandleData = {
	time: Time;
	open: number;
	high: number;
	low: number;
	close: number;
};

type LineData = {
	time: Time;
	value: number;
};

let randomFactor = 25 + Math.random() * 25;
const samplePoint = (i: number) =>
	i *
		(0.5 +
			Math.sin(i / 10) * 0.2 +
			Math.sin(i / 20) * 0.4 +
			Math.sin(i / randomFactor) * 0.8 +
			Math.sin(i / 500) * 0.5) +
	200;

/** Daily points from 2018-01-01, one per calendar day, weekends included. */
export function generateLineData(numberOfPoints: number = 500): LineData[] {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = (date.getTime() / 1000) as Time;
		res.push({ time, value: samplePoint(i) });
		date.setUTCDate(date.getUTCDate() + 1);
	}
	return res;
}

function randomNumber(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function randomBar(lastClose: number): Omit<CandleData, 'time'> {
	const open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
	const close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);
	const high = +randomNumber(Math.max(open, close), Math.max(open, close) * 1.1).toFixed(2);
	const low = +randomNumber(Math.min(open, close) * 0.9, Math.min(open, close)).toFixed(2);
	return { open, high, low, close };
}

/** Daily candles whose close carries over from bar to bar. */
export function generateCandleData(numberOfPoints: number = 250): CandleData[] {
	const lineData = generateLineData(numberOfPoints);
	let lastClose = lineData[0].value;
	return lineData.map(d => {
		const candle = randomBar(lastClose);
		lastClose = candle.close;
		return { time: d.time, ...candle };
	});
}
