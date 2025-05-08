import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
} from 'lightweight-charts';
import {
	convertToLineData,
	generateAlternativeCandleData,
} from '../../../sample-data';
import { applyProductIndicator } from '../product';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolOneData = convertToLineData(
	generateAlternativeCandleData(250, new Date(2024, 0, 1))
);
const symbolTwoData = convertToLineData(
	generateAlternativeCandleData(250, new Date(2024, 0, 1))
);

const [s1InitialData, s1ExtraData] = [
	symbolOneData.slice(0, 150),
	symbolOneData.slice(150),
];
const [s2InitialData, s2ExtraData] = [
	symbolTwoData.slice(0, 150),
	symbolTwoData.slice(150),
];

const seriesOne = chart.addSeries(LineSeries, {
	color: 'rgb(160, 0, 80)',
});
seriesOne.setData(s1InitialData);

const seriesTwo = chart.addSeries(LineSeries, {
	color: 'rgb(80, 0, 160)',
});
seriesTwo.setData(s2InitialData);

const productSeries = applyProductIndicator(seriesOne, seriesTwo, {
	allowMismatchedDates: false,
});
productSeries.applyOptions({
	color: 'black',
	lineStyle: LineStyle.Dotted,
	lineWidth: 1,
});

productSeries.moveToPane(1);

chart.timeScale().fitContent();

function delay(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

setTimeout(async () => {
	for (const d of s1ExtraData) {
		seriesOne.update(d);
		await delay(100);
	}
}, 2000);

setTimeout(async () => {
	for (const d of s2ExtraData) {
		seriesTwo.update(d);
		await delay(100);
	}
}, 3000); // lagging on purpose
