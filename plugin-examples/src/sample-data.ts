import type { Time, WhitespaceData } from 'lightweight-charts';

type LineData = {
	time: Time;
	value: number;
};

export type CandleData = {
	time: Time;
	high: number;
	low: number;
	close: number;
	open: number;
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

export function generateLineData(numberOfPoints: number = 500): LineData[] {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = (date.getTime() / 1000) as Time;
		const value = samplePoint(i);
		res.push({
			time,
			value,
		});

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}

export function generateCandleData(numberOfPoints: number = 250): CandleData[] {
	const lineData = generateLineData(numberOfPoints);
	return lineData.map((d, i) => {
		const randomRanges = [-1 * Math.random(), Math.random(), Math.random()].map(
			j => j * 10
		);
		const sign = Math.sin(Math.random() - 0.5);
		return {
			time: d.time,
			low: d.value + randomRanges[0],
			high: d.value + randomRanges[1],
			open: d.value + sign * randomRanges[2],
			close: samplePoint(i + 1),
		};
	});
}

function randomNumber(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

function randomBar(lastClose: number) {
	const open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
	const close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);
	const high = +randomNumber(
		Math.max(open, close),
		Math.max(open, close) * 1.1
	).toFixed(2);
	const low = +randomNumber(
		Math.min(open, close) * 0.9,
		Math.min(open, close)
	).toFixed(2);
	return {
		open,
		high,
		low,
		close,
	};
}

export function generateAlternativeCandleData(
	numberOfPoints: number = 250
): CandleData[] {
	const lineData = generateLineData(numberOfPoints);
	let lastClose = lineData[0].value;
	return lineData.map(d => {
		const candle = randomBar(lastClose);
		lastClose = candle.close;
		return {
			time: d.time,
			low: candle.low,
			high: candle.high,
			open: candle.open,
			close: candle.close,
		};
	});
}

export function shuffleValuesWithLimit<T extends WhitespaceData[]>(
	arr: T,
	limit: number
): T {
	const n = arr.length;
	const originalTimes = arr.map(item => item.time);
	for (let i = 0; i < n; i++) {
		// Generate a random index within the limit
		const j =
			Math.floor(Math.random() * (Math.min(n - 1, i + limit) - i + 1)) + i;
		// Swap the current element with the randomly selected element
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	arr.forEach((item, index) => {
		item.time = originalTimes[index];
	});
	return arr;
}

function splitArrayIntoParts<T>(arr: T[], size: number): T[][] {
	const result = [];
	const length = arr.length;
	let start = 0;
	while (start < length) {
		result.push(arr.slice(start, start + size));
		start += size;
	}
	return result;
}

interface MultibarData extends WhitespaceData {
	values: number[];
}

export function multipleBarData(
	groups: number,
	numberPoints: number,
	shuffleLimit = 0
): MultibarData[] {
	const basePoints = generateLineData(groups * numberPoints).map(d => {
		return {
			...d,
			value: Math.max(d.value, 0), // prevent negative numbers
		};
	});
	let sets: LineData[][] = splitArrayIntoParts(basePoints, numberPoints);
	if (shuffleLimit > 0) {
		sets = sets.map(set => shuffleValuesWithLimit(set, shuffleLimit));
	}
	return sets[0].map((dataPoint, index) => {
		return {
			time: dataPoint.time,
			values: sets.map(set => set[index].value),
		};
	});
}
