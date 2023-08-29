import { createChart } from 'lightweight-charts';
import { HeatMapSeries } from '../heatmap-series';
import { HeatMapData, HeatmapCell } from '../data';
import { generateLineData } from '../../../sample-data';
import { generateBellCurveHeatMapData } from '../bell-curve-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineData = generateLineData(250);
const heatmapData: (HeatMapData)[] = generateBellCurveHeatMapData(
	lineData,
	20,
	5
);
const maxAmount = heatmapData.reduce(
	(currentMax: number, dataPoint: HeatMapData) => {
		const maxCellAmount = dataPoint.cells.reduce(
			(cellsMax: number, cell: HeatmapCell) => {
				if (cell.amount > cellsMax) return cell.amount;
				return cellsMax;
			},
			0
		);
		if (maxCellAmount > currentMax) return maxCellAmount;
		return currentMax;
	},
	0
);

// function turboColor(t: number): string {
//     t = Math.max(0, Math.min(1, t));
//     const r = Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))));
//     const g = Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))));
//     const b = Math.max(50, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))));
//     return `rgba(${r}, ${g}, ${b}, ${t * 5})`;
// }

// const cellShader = (amount: number) => {
// 	return turboColor(amount / maxAmount);
// };
const cellShader = (amount: number) => {
	const amt = 100 * (amount / maxAmount);
	const r = 155 - amt;
	const g = 0;
	const b = 155 + amt;
	return `rgba(${r}, ${g}, ${b}, ${0.05 + amt * 0.010})`;
}

const customSeriesView = new HeatMapSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	cellShader,
	cellBorderWidth: 0,
});

myCustomSeries.setData(heatmapData);

const lineSeries = chart.addLineSeries({
	color: 'black',
});
lineSeries.setData(lineData);
