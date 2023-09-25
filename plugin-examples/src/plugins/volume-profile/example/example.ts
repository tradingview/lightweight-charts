import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { VolumeProfile } from '../volume-profile';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addLineSeries();
const data = generateLineData();
lineSeries.setData(data);

const basePrice = data[data.length - 50].value;
const priceStep = Math.round(basePrice * 0.1);
const profile = [];
for (let i = 0; i < 15; i++) {
	profile.push({
		price: basePrice + i * priceStep,
		vol: Math.round(Math.random() * 20),
	});
}
const vpData = {
	time: data[data.length - 50].time,
	profile,
	width: 10, // number of bars width
};
const vp = new VolumeProfile(chart, lineSeries, vpData);
lineSeries.attachPrimitive(vp);
