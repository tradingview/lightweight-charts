import {
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { applyPercentChangeIndicator } from '../percent-change';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));
const [initialData, extraData] = [
	symbolData.slice(0, 100),
	symbolData.slice(100),
];

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(initialData);

const pcSeries = applyPercentChangeIndicator(mainSeries, {
	offset: 2,
});
pcSeries.applyOptions({
	color: 'purple',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
});

pcSeries.moveToPane(1);

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
