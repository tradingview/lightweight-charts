import { LineData } from 'lightweight-charts';
import { HeatMapData } from './data';

export function generateBellCurve(
	center: number,
	spread: number,
	binSize: number
) {
	// Generate random data following a bell curve
	const data: number[] = [];
	for (let i = 0; i < 10000; i++) {
		const value =
			center +
			spread *
				(Math.sqrt(-2 * Math.log(Math.random())) *
					Math.cos(2 * Math.PI * Math.random()));
		data.push(value);
	}

	// Create histogram using the generated data
	const histogram: Record<number, number> = {};
	data.forEach(value => {
		const bin = Math.floor(value / binSize) * binSize;
		histogram[bin] = (histogram[bin] || 0) + 1;
	});

	// Convert histogram object to arrays
	const histogramData = Object.entries(histogram).map(([bin, frequency]) => ({
		bin: parseFloat(bin),
		frequency: frequency * (1 + (Math.random() - 0.5) * 0.5),
	}));

	return histogramData;
}

export function generateBellCurveHeatMapData(
	lineData: LineData[],
	spread: number,
	binSize: number
): HeatMapData[] {
	return lineData.map(ldata => {
		const curveData = generateBellCurve(ldata.value, spread, binSize);
		return {
			cells: curveData.map(curve => {
				return {
					amount: curve.frequency,
					low: curve.bin,
					high: curve.bin + binSize,
				};
			}),
			time: ldata.time,
		};
	});
}
