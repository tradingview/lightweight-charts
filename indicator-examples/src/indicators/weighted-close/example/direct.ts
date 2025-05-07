import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { calculateWeightedCloseIndicatorValues } from '../weighted-close-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(symbolData);

const weightedCloseData = calculateWeightedCloseIndicatorValues(symbolData, {});
const weightedCloseSeries = chart.addSeries(LineSeries, {
	color: 'black',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
});
weightedCloseSeries.setData(weightedCloseData);

chart.timeScale().fitContent();
