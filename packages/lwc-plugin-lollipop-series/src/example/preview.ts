import { createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { createLollipopSeries } from '../lollipop-series';
import { lollipopData } from './sample-data';

// The catalog preview: one clean run of values around zero. The dev demo next
// door keeps the whitespace gap and the per-point colors.
const chart = createChart('chart', {
	autoSize: true,
	timeScale: { barSpacing: 12 },
});

const series = createLollipopSeries(chart, {
	color: '#2962FF',
});
series.setData(lollipopData(50));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Dot',
		options: ['8', '4', '12'],
		onChange: value => series.applyOptions({ markerSize: Number(value) }),
	},
	{
		kind: 'select',
		label: 'Base',
		options: ['0', '-5', '5'],
		onChange: value => series.applyOptions({ base: Number(value) }),
	},
	{
		kind: 'select',
		label: 'Stem',
		options: ['2', '1', '4'],
		onChange: value => series.applyOptions({ lineWidth: Number(value) }),
	},
]);
