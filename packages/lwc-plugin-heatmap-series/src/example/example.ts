import { createChart } from 'lightweight-charts';
import { HeatMapSeries } from '../heatmap-series';
import { HeatMapData } from '../data';
import { generateHeatmapData } from '../sample-heatmap-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		barSpacing: 24,
	},
	rightPriceScale: {
		scaleMargins: {
			top: 0.025,
			bottom: 0.025,
		},
	},
}));

const heatmapData: HeatMapData[] = generateHeatmapData();
const maxAmount = 36;

function turboColor(t: number): string {
    t = Math.max(0, Math.min(1, t));
    const r = Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))));
    const g = Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))));
    const b = Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))));
    return `rgb(${r}, ${g}, ${b})`;
}

const cellShader = (amount: number) => {
	return turboColor(amount / maxAmount);
};

const customSeriesView = new HeatMapSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	cellShader,
    // cellBorderColor: 'white',
});

myCustomSeries.setData(heatmapData);
