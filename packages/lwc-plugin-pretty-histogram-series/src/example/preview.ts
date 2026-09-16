import { Time, createChart } from 'lightweight-charts';
import { addRefreshButton, mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { PrettyHistogramData } from '../data';
import { createPrettyHistogramSeries } from '../pretty-histogram-series';
import { generateLineData } from './sample-data';

// The catalogue preview: sixty bars centred on zero, so both signs are visible
// at a readable bar width, and no whitespace. The dev demo next door keeps the
// gap and the per-bar colour editors.
function buildData(): PrettyHistogramData<Time>[] {
	const line = generateLineData(60);
	const values = line.map(item => item.value);
	const middle = (Math.min(...values) + Math.max(...values)) / 2;
	return line.map(item => ({ time: item.time, value: item.value - middle }));
}

const chart = createChart('chart', { autoSize: true });

const series = createPrettyHistogramSeries(chart, {
	radius: 4,
	widthPercent: 50,
	upColor: '#089981',
	downColor: '#f23645',
});

function fill(): void {
	series.setData(buildData());
	chart.timeScale().fitContent();
}
fill();

mountControls([
	{
		kind: 'select',
		label: 'Radius',
		options: ['4', '0', '8', '12'],
		onChange: value => series.applyOptions({ radius: Number(value) }),
	},
	{
		kind: 'select',
		label: 'Width',
		options: [
			{ value: '50', label: '50%' },
			{ value: '25', label: '25%' },
			{ value: '80', label: '80%' },
			{ value: '100', label: '100%' },
		],
		onChange: value => series.applyOptions({ widthPercent: Number(value) }),
	},
	{
		kind: 'checkbox',
		label: 'Two-tone by sign',
		checked: true,
		onChange: checked => series.applyOptions({
			upColor: checked ? '#089981' : null,
			downColor: checked ? '#f23645' : null,
		}),
	},
]);

addRefreshButton(fill);
