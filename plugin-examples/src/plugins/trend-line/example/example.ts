import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { TrendLine } from '../trend-line';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addLineSeries();
const data = generateLineData();
lineSeries.setData(data);

const dataLength = data.length;
const point1 = {
	time: data[dataLength - 50].time,
	price: data[dataLength - 50].value * 0.9,
};
const point2 = {
	time: data[dataLength - 5].time,
	price: data[dataLength - 5].value * 1.10,
};
const trend = new TrendLine(chart, lineSeries, point1, point2);
lineSeries.attachPrimitive(trend);
