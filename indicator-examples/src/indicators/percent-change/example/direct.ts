import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { calculatePercentChangeIndicatorValues } from '../percent-change-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(symbolData);

const pc = calculatePercentChangeIndicatorValues(symbolData, {});
const pcSeries = chart.addSeries(
	LineSeries, 
	{
		color: 'blue',
		lineWidth: 2,
		lineStyle: LineStyle.Solid,
	},
	1
);
pcSeries.setData(pc);

chart.timeScale().fitContent();
