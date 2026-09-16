import { createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { StackedBarsColumnWidthMode } from '../options';
import { createStackedBarsSeries } from '../stacked-bars-series';
import { multipleBarData } from './sample-data';

// The catalogue preview: positive values, no whitespace. The dev demo next door
// keeps the negative stretch and the gap.
const chart = createChart('chart', {
	autoSize: true,
	timeScale: { minBarSpacing: 3 },
});

const series = createStackedBarsSeries(chart, {
	color: 'black', // for the price line
	widthPercent: 60,
});
series.setData(multipleBarData(3, 120, 20));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Width',
		options: ['histogram', 'percent'],
		onChange: value => series.applyOptions({ columnWidthMode: value as StackedBarsColumnWidthMode }),
	},
	{
		kind: 'checkbox',
		label: '100% stacked',
		// priceValueBuilder already stacks with `percent`, so the plugin
		// autoscales 0..100 without a price range of its own.
		onChange: checked => series.applyOptions({ percent: checked }),
	},
	{
		kind: 'select',
		label: 'Radius',
		options: ['0', '2', '4', '8'],
		onChange: value => series.applyOptions({ radius: Number(value) }),
	},
]);
