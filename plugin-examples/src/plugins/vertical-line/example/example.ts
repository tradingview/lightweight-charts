import { LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { VerticalLine } from '@tradingview/lwc-plugin-vertical-line';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries);
const data = generateLineData();
lineSeries.setData(data);

const verticalLine = new VerticalLine(data[data.length - 50].time, {
	showLabel: true,
	labelText: 'Hello',
});
lineSeries.attachPrimitive(verticalLine);

const verticalLine2 = new VerticalLine(data[data.length - 25].time, {
	showLabel: false,
	color: 'red',
	width: 2,
});
lineSeries.attachPrimitive(verticalLine2);
