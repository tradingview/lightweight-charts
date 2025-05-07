import {
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { applyWeightedCloseIndicator } from '../weighted-close';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));
const [initialData, extraData] = [
	symbolData.slice(0, 100),
	symbolData.slice(100),
];

const weightInputElement = document.getElementById('weight');

let weight = 2;

if (weightInputElement instanceof HTMLInputElement) {
	weight = Number.parseInt(weightInputElement.value, 10);
}

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(initialData);

const weightedCloseSeries = applyWeightedCloseIndicator(mainSeries, {
	offset: 2,
});
weightedCloseSeries.indicatorSeries().applyOptions({
	color: 'orange',
	lineWidth: 2,
	lineStyle: LineStyle.Dotted,
});

if (weightInputElement instanceof HTMLInputElement) {
	weightInputElement.addEventListener('input', () => {
		weight = Number.parseInt(weightInputElement.value, 10);

		weightedCloseSeries.applyOptions({ weight });
	});
}

chart.timeScale().fitContent();

setTimeout(async () => {
	function delay(ms: number): Promise<void> {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
	for (const d of extraData) {
		mainSeries.update(d);
		await delay(200);
	}
}, 2000);
