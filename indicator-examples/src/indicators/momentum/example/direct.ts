import {
	LineSeries,
	ChartOptions,
	createChart,
	DeepPartial,
	LineStyle,
	CandlestickSeries,
} from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { calculateMomentumIndicatorValues } from '../momentum-calculation';

const chartOptions = {
	autoSize: true,
} satisfies DeepPartial<ChartOptions>;

const chart = createChart('chart', chartOptions);

const symbolData = generateAlternativeCandleData(150, new Date(2024, 0, 1));

const mainSeries = chart.addSeries(CandlestickSeries, {});
mainSeries.setData(symbolData);

const momemtum = calculateMomentumIndicatorValues(symbolData, {
	length: 10,
	source: 'close',
});
const momemtumSeries = chart.addSeries(LineSeries, {
	color: 'black',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
});
momemtumSeries.setData(momemtum);

chart.timeScale().fitContent();
