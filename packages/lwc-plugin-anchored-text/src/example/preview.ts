import { LineSeries, createChart } from 'lightweight-charts';
import { addRefreshButton, mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import {
	AnchoredText,
	AnchoredTextHorzAlign,
	AnchoredTextVertAlign,
} from '../anchored-text';
import { generateLineData } from './sample-data';

const chart = createChart('chart', { autoSize: true });

const text = new AnchoredText({
	text: 'BTC/USD · 1D',
	horzAlign: 'right',
	font: 'bold 16px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
	color: '#2962FF',
});

const series = chart.addSeries(LineSeries);
series.setData(generateLineData());
series.attachPrimitive(text);
let attached = true;

mountControls([
	{
		kind: 'select',
		label: 'Anchor',
		options: [
			'top-left', 'top-center', 'top-right',
			'center-left', 'center-center', 'center-right',
			'bottom-left', 'bottom-center', 'bottom-right',
		].map(value => ({ value, label: value.replace('center-center', 'center') })),
		value: 'top-right',
		onChange: value => {
			const [vertAlign, horzAlign] = value.split('-') as [AnchoredTextVertAlign, AnchoredTextHorzAlign];
			text.applyOptions({ horzAlign, vertAlign });
		},
	},
	{
		kind: 'checkbox',
		label: 'Visible',
		checked: true,
		onChange: visible => text.applyOptions({ visible }),
	},
	{
		kind: 'button',
		label: 'Detach',
		onClick: button => {
			if (attached) {
				series.detachPrimitive(text);
			} else {
				series.attachPrimitive(text);
			}
			attached = !attached;
			button.textContent = attached ? 'Detach' : 'Attach';
		},
	},
]);

addRefreshButton(() => {
	series.setData(generateLineData());
	chart.timeScale().fitContent();
});
