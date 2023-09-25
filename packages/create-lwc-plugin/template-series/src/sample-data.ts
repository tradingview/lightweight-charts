import type { Time } from 'lightweight-charts';
import { _CLASSNAME_Data } from './data';

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

function generateLineData(numberOfPoints: number = 500): LineData[] {
	randomFactor = 25 + Math.random() * 25;
	const res = [];
	const date = new Date(Date.UTC(2023, 0, 1, 12, 0, 0, 0));
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

export function generateSampleData(
	numberOfPoints: number = 500,
	averageWidth: number = 50
): _CLASSNAME_Data[] {
	return generateLineData(numberOfPoints).map(lineDataPoint => {
		const high = lineDataPoint.value + Math.random() * averageWidth;
		const low = lineDataPoint.value - Math.random() * averageWidth;
		return {
			time: lineDataPoint.time,
			high,
			low,
		};
	});
}
