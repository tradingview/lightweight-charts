import { Time, WhitespaceData, createChart } from 'lightweight-charts';
import { generateLineData } from './sample-data';
import { PrettyHistogramSeries } from '../pretty-histogram-series';
import { PrettyHistogramData } from '../data';

type Point = PrettyHistogramData<Time> | WhitespaceData<Time>;

// Values on both sides of the base line, with a gap of whitespace in the middle:
// the two cases a histogram renderer is most likely to get wrong.
function buildData(count: number): Point[] {
	const line = generateLineData(count);
	const values = line.map(item => item.value);
	const middle = (Math.min(...values) + Math.max(...values)) / 2;
	return line.map((item, index: number) => {
		if (index >= 28 && index < 36) {
			return { time: item.time };
		}
		return { time: item.time, value: item.value - middle };
	});
}

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const series = chart.addCustomSeries(new PrettyHistogramSeries(), {
	radius: 4,
	widthPercent: 50,
	upColor: '#089981',
	downColor: '#f23645',
});

series.setData(buildData(80));
chart.timeScale().fitContent();

function control(id: string): HTMLInputElement {
	return document.getElementById(id) as HTMLInputElement;
}

const radius = control('radius');
const radiusValue = document.getElementById('radius-value') as HTMLOutputElement;
radius.oninput = () => {
	radiusValue.value = radius.value;
	series.applyOptions({ radius: Number(radius.value) });
};

const width = control('width');
const widthValue = document.getElementById('width-value') as HTMLOutputElement;
width.oninput = () => {
	widthValue.value = width.value;
	series.applyOptions({ widthPercent: Number(width.value) });
};

const upColor = control('up-color');
const downColor = control('down-color');
const twoTone = control('two-tone');

function applyColors(): void {
	series.applyOptions({
		upColor: twoTone.checked ? upColor.value : null,
		downColor: twoTone.checked ? downColor.value : null,
	});
}

upColor.oninput = applyColors;
downColor.oninput = applyColors;
twoTone.onchange = applyColors;
