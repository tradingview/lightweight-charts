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
import { createRatioIndicator } from '../ratio-indicator';

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

const seriesOne = chart.addSeries(LineSeries, {
	color: 'rgb(160, 0, 80)',
});
seriesOne.setData(symbolOneData);

const seriesTwo = chart.addSeries(LineSeries, {
	color: 'rgb(80, 0, 160)',
});
seriesTwo.setData(symbolTwoData);

const ratioIndicator = createRatioIndicator(seriesOne, {
	comparisonData: symbolTwoData,
	source: 'value',
	seriesOptions: {
		lineStyle: LineStyle.Dotted,
		color: 'black',
		lineWidth: 1,
	},
});

ratioIndicator.attach(chart);

chart.timeScale().fitContent();
