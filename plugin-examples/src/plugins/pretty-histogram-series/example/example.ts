import { Time, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { createPrettyHistogramSeries, PrettyHistogramData } from '@tradingview/lwc-plugin-pretty-histogram-series';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const myCustomSeries = createPrettyHistogramSeries(chart, {
	radius: 6,
	widthPercent: 50,
	upColor: '#089981',
	downColor: '#F23645',
});

// Values on both sides of the base line, so that the two-tone colouring is
// visible. The base is always part of the autoscale, so nothing else is needed
// to keep the zero line in view.
const generated = generateLineData(6);
const values = generated.map((item: { value: number }) => item.value);
const middle = (Math.min(...values) + Math.max(...values)) / 2;
const data: PrettyHistogramData<Time>[] = generated.map((item: { time: Time; value: number }) => ({
	time: item.time,
	value: item.value - middle,
}));
data[1].color = '#6438D6';

myCustomSeries.setData(data);

chart.timeScale().fitContent();

data.forEach((item: PrettyHistogramData<Time>, i: number) => {
	const element = document.getElementById(`bar_${i + 1}`) as HTMLInputElement;
	element.value = item.value.toFixed(2);
	element.onchange = () => {
		const newValue = parseFloat(element.value);
		if (!isNaN(newValue)) {
			item.value = newValue;
			myCustomSeries.setData(data);
		}
	};
});

const radiusElement = document.getElementById('radius') as HTMLInputElement;
radiusElement.value = myCustomSeries.options().radius.toString();
radiusElement.onchange = () => {
	const newRadius = parseFloat(radiusElement.value);
	if (newRadius >= 0) {
		myCustomSeries.applyOptions({ radius: newRadius });
	}
};

const widthElement = document.getElementById('width') as HTMLInputElement;
widthElement.value = myCustomSeries.options().widthPercent.toString();
widthElement.onchange = () => {
	const newWidth = parseFloat(widthElement.value);
	if (newWidth >= 0 && newWidth <= 100) {
		myCustomSeries.applyOptions({ widthPercent: newWidth });
	}
};

const upColorElement = document.getElementById('upColor') as HTMLInputElement;
const downColorElement = document.getElementById('downColor') as HTMLInputElement;
const twoToneElement = document.getElementById('twoTone') as HTMLInputElement;

function applyColors(): void {
	myCustomSeries.applyOptions({
		upColor: twoToneElement.checked ? upColorElement.value : null,
		downColor: twoToneElement.checked ? downColorElement.value : null,
	});
}

upColorElement.oninput = applyColors;
downColorElement.oninput = applyColors;
twoToneElement.onchange = applyColors;
