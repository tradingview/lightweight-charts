import { createChart } from 'lightweight-charts';
import { addRefreshButton, mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { type PreviewTheme, previewTheme, themeChart } from '@tradingview/lwc-plugin-preview-kit/preview-theme';
import { RoundedCandleRadius } from '../radius';
import { RoundedCandleSeries } from '../rounded-candles-series';
import { generateAlternativeCandleData } from './sample-data';

// The catalogue preview: plain candles, no whitespace run, no per-point colour
// overrides and no hover dimming (the plugin's own default). The dev demo next
// door keeps all three.
const chart = createChart('chart', { autoSize: true });

const series = chart.addCustomSeries(new RoundedCandleSeries(), {});

type Borders = 'matching' | 'contrast' | 'none';
let borders: Borders = 'matching';

/**
 * Contrasting borders step away from the body towards the background's
 * opposite: darker on light, lighter on dark.
 */
function applyBorders(theme: PreviewTheme): void {
	const contrast = theme === 'dark'
		? { up: '#B2DFDB', down: '#FFCDD2' }
		: { up: '#00695C', down: '#B71C1C' };
	series.applyOptions({
		borderVisible: borders !== 'none',
		borderUpColor: borders === 'contrast' ? contrast.up : '#26a69a',
		borderDownColor: borders === 'contrast' ? contrast.down : '#ef5350',
	});
}
themeChart(chart, applyBorders);

function fill(): void {
	series.setData(generateAlternativeCandleData(60));
	chart.timeScale().fitContent();
}
fill();

const autoRadius: RoundedCandleRadius = (barSpacing: number) =>
	barSpacing < 4 ? 0 : barSpacing / 3;

mountControls([
	{
		kind: 'select',
		label: 'Radius',
		options: [
			{ value: 'auto', label: 'Auto (bar spacing)' },
			{ value: '0', label: '0 — square' },
			{ value: '4', label: '4' },
			{ value: '10', label: '10' },
		],
		onChange: value => series.applyOptions({
			radius: value === 'auto' ? autoRadius : Number(value),
		}),
	},
	{
		kind: 'select',
		label: 'Borders',
		options: [
			{ value: 'matching', label: 'Matching the body' },
			{ value: 'contrast', label: 'Contrasting' },
			{ value: 'none', label: 'None' },
		],
		onChange: value => {
			borders = value as Borders;
			applyBorders(previewTheme());
		},
	},
]);

addRefreshButton(fill);
