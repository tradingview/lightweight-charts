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
import { calculateProductIndicatorValues } from '../product-calculation';

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

const productIndicatorData = calculateProductIndicatorValues(
	symbolOneData,
	symbolTwoData,
	{
		allowMismatchedDates: true,
	}
);

const productIndicatorSeries = chart.addSeries(
	LineSeries, 
	{
		color: 'black',
		lineStyle: LineStyle.Dotted,
		lineWidth: 1,
	},
	1
);
productIndicatorSeries.setData(productIndicatorData);

chart.timeScale().fitContent();
