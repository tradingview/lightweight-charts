import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { calculateMedianPriceIndicatorValues } from '../median-price-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(symbolData);

const mp = calculateMedianPriceIndicatorValues(symbolData, {});
const mpSeries = chart.addSeries(LineSeries, {
	color: 'blue',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
});
mpSeries.setData(mp);

chart.timeScale().fitContent();
