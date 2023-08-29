import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { VertLine } from '../vertical-line';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addLineSeries();
const data = generateLineData();
lineSeries.setData(data);

const vertLine = new VertLine(chart, lineSeries, data[data.length - 50].time, {
	showLabel: true,
	labelText: 'Hello',
});
lineSeries.attachPrimitive(vertLine);

const vertLine2 = new VertLine(chart, lineSeries, data[data.length - 25].time, {
	showLabel: false,
	color: 'red',
	width: 2,
});
lineSeries.attachPrimitive(vertLine2);
