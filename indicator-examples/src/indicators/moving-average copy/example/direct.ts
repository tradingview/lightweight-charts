import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { calculateMovingAverageIndicatorValues } from '../moving-average-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(symbolData);

// Basic SMA
const maSMA = calculateMovingAverageIndicatorValues(symbolData, {
	length: 20,
	source: 'close',
});
const maSMASeries = chart.addSeries(LineSeries, {
	color: 'black',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
});
maSMASeries.setData(maSMA);

// EMA with offset and smoothing
const maEMA = calculateMovingAverageIndicatorValues(symbolData, {
	length: 10,
	source: 'close',
	offset: 2,
	smoothingLine: 'EMA',
	smoothingLength: 5,
});
const maEMASeries = chart.addSeries(LineSeries, {
	color: 'orange',
	lineWidth: 2,
	lineStyle: LineStyle.Dotted,
});
maEMASeries.setData(maEMA);

chart.timeScale().fitContent();
