import {
	CustomSeriesWhitespaceData,
	LineStyle,
	Time,
	createChart,
} from 'lightweight-charts';
import { HLCAreaSeries } from '../hlc-area-series';
import { HLCAreaData } from '../data';
import { HLCAreaLineType } from '../options';
import { generateAlternativeCandleData } from './sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const series = chart.addCustomSeries(new HLCAreaSeries(), {});

const data: (HLCAreaData | CustomSeriesWhitespaceData<Time>)[] =
	generateAlternativeCandleData(80);
// A run of whitespace: the lines and the fills break there rather than bridging
// the gap with a straight segment.
for (let i = 30; i < 38; i++) {
	data[i] = { time: data[i].time };
}
series.setData(data);

const lineStyleSelect = document.getElementById(
	'line-style'
) as HTMLSelectElement;
const lineTypeSelect = document.getElementById('line-type') as HTMLSelectElement;
const areaSelect = document.getElementById('area') as HTMLSelectElement;
const closeLineInput = document.getElementById('close-line') as HTMLInputElement;

lineStyleSelect.addEventListener('change', () => {
	const lineStyle = Number(lineStyleSelect.value) as LineStyle;
	series.applyOptions({
		highLineStyle: lineStyle,
		lowLineStyle: lineStyle,
		closeLineStyle: lineStyle,
	});
});

lineTypeSelect.addEventListener('change', () => {
	series.applyOptions({ lineType: lineTypeSelect.value as HLCAreaLineType });
});

areaSelect.addEventListener('change', () => {
	const mode = areaSelect.value;
	series.applyOptions({
		areaVisible: mode !== 'none',
		// Both stops of a pair have to be set for the gradient to be used.
		highAreaTopColor: mode === 'gradient' ? 'rgba(4, 153, 129, 0.8)' : '',
		highAreaBottomColor: mode === 'gradient' ? 'rgba(4, 153, 129, 0.05)' : '',
		lowAreaTopColor: mode === 'gradient' ? 'rgba(242, 54, 69, 0.05)' : '',
		lowAreaBottomColor: mode === 'gradient' ? 'rgba(242, 54, 69, 0.8)' : '',
	});
});

closeLineInput.addEventListener('change', () => {
	series.applyOptions({ closeLineVisible: closeLineInput.checked });
});

// Zoomed into the middle of the data, so the first and the last visible points
// are off the pane and the band runs to both edges.
chart.timeScale().setVisibleLogicalRange({ from: 20.5, to: 60.5 });
