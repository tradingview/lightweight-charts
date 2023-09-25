import { createChart } from 'lightweight-charts';
import { generateLineData } from '../sample-data';
import { _CLASSNAME_ } from '../template-entry';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addLineSeries({
	color: '#000000',
});
const data = generateLineData();
lineSeries.setData(data);

const time1 = data[data.length - 50].time;
const time2 = data[data.length - 10].time;

const primitive = new _CLASSNAME_(
	{ price: 100, time: time1 },
	{ price: 500, time: time2 }
);

lineSeries.attachPrimitive(primitive);
