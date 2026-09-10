import { LineStyle, createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { BrushableAreaInteraction } from '../interaction';
import { BrushableAreaStyle } from '../options';
import { createBrushableAreaSeries } from '../brushable-area-series';
import { generateLineData } from './sample-data';

// The catalogue preview: one series, no whitespace and no range read-out. The
// selection is the point of the plugin, so the reader has to be able to drag
// across the frame without the layout moving underneath: nothing here writes
// text into the control row while brushing.
const chart = createChart('chart', {
	autoSize: true,
	grid: { vertLines: { visible: false }, horzLines: { visible: false } },
	timeScale: { borderVisible: false },
	rightPriceScale: { borderVisible: false },
	// Brushing and panning are the same gesture, so the chart gives it up.
	handleScale: false,
	handleScroll: false,
});

const brushStyles: Record<string, Partial<BrushableAreaStyle>> = {
	green: {
		lineColor: 'rgb(4,153,129)',
		topColor: 'rgba(4,153,129, 0.4)',
		bottomColor: 'rgba(4,153,129, 0)',
		lineWidth: 3,
	},
	orange: {
		lineColor: 'rgb(245,124,0)',
		topColor: 'rgba(245,124,0, 0.4)',
		bottomColor: 'rgba(245,124,0, 0)',
		lineWidth: 3,
	},
	red: {
		lineColor: 'rgb(242,54,69)',
		topColor: 'rgba(242,54,69, 0.4)',
		bottomColor: 'rgba(242,54,69, 0)',
		lineWidth: 3,
	},
};

const series = createBrushableAreaSeries(chart, {
	priceLineVisible: false,
	lastValueVisible: false,
	lineColor: 'rgb(40,98,255)',
	topColor: 'rgba(40,98,255, 0.4)',
	bottomColor: 'rgba(40,98,255, 0)',
});
series.setData(generateLineData(200));
chart.timeScale().fitContent();

const brush = new BrushableAreaInteraction({ style: brushStyles.green });
series.attachPrimitive(brush);

mountControls([
	{
		kind: 'select',
		label: 'Brush style',
		options: [
			{ value: 'green', label: 'Green' },
			{ value: 'orange', label: 'Orange' },
			{ value: 'red', label: 'Red' },
		],
		onChange: value => brush.applyOptions({ style: brushStyles[value] }),
	},
	{
		kind: 'select',
		label: 'Line style',
		options: [
			{ value: '0', label: 'Solid' },
			{ value: '2', label: 'Dashed' },
			{ value: '1', label: 'Dotted' },
		],
		onChange: value => series.applyOptions({ lineStyle: Number(value) as LineStyle }),
	},
]);
