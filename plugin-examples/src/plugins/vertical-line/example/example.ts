import { LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { VertLine } from '../vertical-line';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries);
const data = generateLineData();
lineSeries.setData(data);

const vertLine = new VertLine(chart, lineSeries, data[data.length - 50].time, {
	showLabel: true,
	labelText: 'Hello',
  coordinate: 0,
});
lineSeries.attachPrimitive(vertLine);

const vertLine2 = new VertLine(chart, lineSeries, data[data.length - 25].time, {
  showLabel: true,
  labelTextColor: 'red',
  labelText: 'Hello',
  coordinate: 50,
});
lineSeries.attachPrimitive(vertLine2);
