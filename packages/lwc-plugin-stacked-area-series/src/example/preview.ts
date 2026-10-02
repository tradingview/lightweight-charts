import { createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { StackedAreaGapHandling, StackedAreaLineType } from '../options';
import { createStackedAreaSeries } from '../stacked-area-series';
import { multipleBarData } from './sample-data';

// The catalogue preview: positive values, no whitespace, nothing to explain.
// The dev demo next door keeps the negative stretch and the gap.
const chart = createChart('chart', {
	autoSize: true,
	rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});

const series = createStackedAreaSeries(chart, {
	// The gap handling only shows on data with whitespace, and this preview has
	// none, so `bridge` is the honest default to open on here.
	gapHandling: 'bridge',
});
series.setData(multipleBarData(5, 120, 2));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Line type',
		options: ['simple', 'step', 'curved'],
		onChange: value => series.applyOptions({ lineType: value as StackedAreaLineType }),
	},
	{
		kind: 'select',
		label: 'Gaps',
		options: ['bridge', 'break'],
		value: 'bridge',
		onChange: value => series.applyOptions({ gapHandling: value as StackedAreaGapHandling }),
	},
	{
		kind: 'checkbox',
		label: '100% stacked',
		// The series autoscales percent mode by itself, so no price range here.
		onChange: checked => series.applyOptions({ percent: checked }),
	},
]);
