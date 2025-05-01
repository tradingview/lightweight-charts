import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { calculateAveragePriceIndicatorValues } from '../average-price-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(symbolData);

const averagePriceData = calculateAveragePriceIndicatorValues(symbolData, {});
const averagePriceSeries = chart.addSeries(LineSeries, {
	color: 'black',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
});
averagePriceSeries.setData(averagePriceData);

chart.timeScale().fitContent();
