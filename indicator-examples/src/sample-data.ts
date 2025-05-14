import type { OhlcData, UTCTimestamp } from 'lightweight-charts';

type LineData = {
	time: UTCTimestamp;
	value: number;
	customValues?: Record<string, unknown>;
};

export type CandleData = OhlcData<UTCTimestamp>;

let randomFactor = 25 + Math.random() * 25;
const samplePoint = (i: number) =>
	i *
		(0.5 +
			Math.sin(i / 10) * 0.2 +
			Math.sin(i / 20) * 0.4 +
			Math.sin(i / randomFactor) * 0.8 +
			Math.sin(i / 500) * 0.5) +
	200;

export function generateLineData(
	numberOfPoints: number = 500,
	startDate: Date
): LineData[] {
	randomFactor = 25 + Math.random() * 25;
	const res: LineData[] = [];
	const date = startDate;
	for (let i = 0; i < numberOfPoints; ++i) {
		const time = (date.getTime() / 1000) as UTCTimestamp;
		const value = samplePoint(i);
		const volume = Math.round(Math.random() * 10_000);
		res.push({
			time,
			value,
			customValues: {
				volume,
			},
		});

		date.setUTCDate(date.getUTCDate() + 1);
	}

	return res;
}

export function generateCandleData(
	numberOfPoints: number = 250,
	startDate: Date
): CandleData[] {
	const lineData = generateLineData(numberOfPoints, startDate);
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
			customValues: d.customValues,
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
	numberOfPoints: number = 250,
	startDate: Date
): CandleData[] {
	const lineData = generateLineData(numberOfPoints, startDate);
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
			customValues: d.customValues,
		};
	});
}

const SINGLE_DAY = 1000 * 60 * 60 * 24;

export function generateMultipleYears<T extends readonly number[]>(
	years: T
): Record<T[number], CandleData[]> {
	const firstYear = Math.min(...years);
	const lastYear = Math.max(...years);
	const firstDate = new Date(Date.UTC(firstYear, 0, 1, 12, 0, 0, 0));
	const lastDate = new Date(Date.UTC(lastYear, 11, 31, 12, 0, 0, 0));
	const numberDays = Math.round(
		(lastDate.valueOf() - firstDate.valueOf()) / SINGLE_DAY
	);
	const allData = generateAlternativeCandleData(numberDays, firstDate);
	const result: Partial<Record<number, CandleData[]>> = {};
	for (const year of years) {
		result[year] = [] as CandleData[];
	}
	for (const dataPoint of allData) {
		const date = new Date((dataPoint.time as number) * 1000);
		date.setHours(0, 0, 0, 0); // we need to use midnight because daylight savings can make it harder to match timestamps later
		const year = date.getUTCFullYear();
		dataPoint.time = (date.getTime() / 1000) as UTCTimestamp;
		result[year]?.push(dataPoint);
	}
	return result as Record<T[number], CandleData[]>;
}

export function convertToLineData(candleData: CandleData[]): LineData[] {
	return candleData.map(d => ({
		time: d.time,
		value: d.close,
		customValues: d.customValues,
	}));
}
