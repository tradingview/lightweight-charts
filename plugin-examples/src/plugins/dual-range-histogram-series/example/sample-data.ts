import { LineData, WhitespaceData } from 'lightweight-charts';
import { multipleBarData } from '../../../sample-data';
import { DualRangeHistogramData } from '../data';

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
