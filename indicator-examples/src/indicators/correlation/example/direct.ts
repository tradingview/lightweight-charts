import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	BaselineSeries,
} from 'lightweight-charts';
import {
	convertToLineData,
	generateAlternativeCandleData,
} from '../../../sample-data';
import { calculateCorrelationIndicatorValues } from '../correlation-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolOneData = generateAlternativeCandleData(250, new Date(2024, 0, 1));
const symbolTwoData = convertToLineData(
	generateAlternativeCandleData(250, new Date(2024, 0, 1))
);

const seriesOne = chart.addSeries(LineSeries, {
	color: 'rgb(160, 0, 80)',
});
seriesOne.setData(convertToLineData(symbolOneData));

const seriesTwo = chart.addSeries(LineSeries, {
	color: 'rgb(80, 0, 160)',
});
seriesTwo.setData(symbolTwoData);

const indicatorData = calculateCorrelationIndicatorValues(
	symbolOneData,
	symbolTwoData,
	{
		allowMismatchedDates: true,
		length: 20,
	}
);

const indicatorSeries = chart.addSeries(
	BaselineSeries,
	{
		baseValue: {
			type: 'price',
			price: 0,
		},
	},
	1
);
indicatorSeries.setData(indicatorData);

chart.timeScale().fitContent();
