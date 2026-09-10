import { Time, WhitespaceData } from 'lightweight-charts';
import { DualRangeHistogramData } from '../data';

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

export function centerLineData(lineData: LineData[]): LineData[] {
	const lineDataValues = lineData.map(i => i.value);
	const min = Math.min(...lineDataValues);
	const max = Math.max(...lineDataValues);
	const mid = (max - min) / 2 + min;
	const adjustedLineData = lineData.map(i => {
		return {
			...i,
			value: i.value - mid,
		};
	});
	return adjustedLineData;
}

export function generateDualRangeHistogramData(
	numberPoints: number
): (DualRangeHistogramData | WhitespaceData)[] {
	return multipleBarData(4, numberPoints, 20).map(datum => {
		const positiveValues = datum.values.slice(0, 2).sort().reverse();
		positiveValues[1] *= 0.5 + Math.random() * 0.5;
		const negativeValues = datum.values
			.slice(2)
			.sort()
			.map(i => -1 * i);
		negativeValues[1] *= 0.5 + Math.random() * 0.5;
		return {
			...datum,
			values: [...positiveValues, ...negativeValues],
		};
	});
}
