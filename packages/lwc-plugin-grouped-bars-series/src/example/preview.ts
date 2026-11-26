import { createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { themeChart } from '@tradingview/lwc-plugin-preview-kit/preview-theme';
import { createGroupedBarsSeries } from '../grouped-bars-series';
import { groupedBarsData } from './sample-data';

// The catalog preview: a handful of groups of three positive values, no
// whitespace. The dev demo next door keeps the gap, the negative stretch and
// the color override.
const POINTS = 8;

const chart = createChart('chart', {
	autoSize: true,
	timeScale: { barSpacing: 48 },
});

const series = createGroupedBarsSeries(chart);
// The series color is only the price line's, which has to read on either
// background.
themeChart(chart, theme => series.applyOptions({ color: theme === 'dark' ? '#D1D4DC' : '#131722' }));
series.setData(groupedBarsData(3, POINTS));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Columns',
		options: ['3', '2', '4'],
		onChange: value => series.setData(groupedBarsData(Number(value), POINTS)),
	},
	{
		kind: 'select',
		label: 'Width',
		options: ['80%', '60%', '100%', 'histogram'],
		onChange: value => series.applyOptions(value === 'histogram'
			? { columnWidthMode: 'histogram' }
			: { columnWidthMode: 'percent', widthPercent: parseFloat(value) }),
	},
]);
