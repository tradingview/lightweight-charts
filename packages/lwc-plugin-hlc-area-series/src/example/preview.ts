import { LineStyle, createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { createHLCAreaSeries } from '../hlc-area-series';
import { HLCAreaLineType } from '../options';
import { generateAlternativeCandleData } from './sample-data';

// The catalogue preview: the whole band in view, no whitespace run. The dev
// demo next door keeps the gap and the zoomed-in range.
const chart = createChart('chart', { autoSize: true });

const series = createHLCAreaSeries(chart, {});
series.setData(generateAlternativeCandleData(250));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Line type',
		options: [
			{ value: 'simple', label: 'Simple' },
			{ value: 'step', label: 'Step' },
		],
		onChange: value => series.applyOptions({ lineType: value as HLCAreaLineType }),
	},
	{
		kind: 'select',
		label: 'Areas',
		options: [
			{ value: 'flat', label: 'Flat fills' },
			{ value: 'gradient', label: 'Gradient fills' },
			{ value: 'none', label: 'Hidden' },
		],
		onChange: mode => series.applyOptions({
			areaVisible: mode !== 'none',
			// Both stops of a pair have to be set for the gradient to be used.
			highAreaTopColor: mode === 'gradient' ? 'rgba(4, 153, 129, 0.8)' : '',
			highAreaBottomColor: mode === 'gradient' ? 'rgba(4, 153, 129, 0.05)' : '',
			lowAreaTopColor: mode === 'gradient' ? 'rgba(242, 54, 69, 0.05)' : '',
			lowAreaBottomColor: mode === 'gradient' ? 'rgba(242, 54, 69, 0.8)' : '',
		}),
	},
	{
		kind: 'select',
		label: 'Line style',
		options: [
			{ value: '0', label: 'Solid' },
			{ value: '2', label: 'Dashed' },
			{ value: '1', label: 'Dotted' },
		],
		onChange: value => {
			const lineStyle = Number(value) as LineStyle;
			series.applyOptions({
				highLineStyle: lineStyle,
				lowLineStyle: lineStyle,
				closeLineStyle: lineStyle,
			});
		},
	},
	{
		kind: 'checkbox',
		label: 'Close line',
		checked: true,
		onChange: checked => series.applyOptions({ closeLineVisible: checked }),
	},
]);
