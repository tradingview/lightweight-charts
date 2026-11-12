import { LineSeries, createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { UserPriceLines } from '../user-price-lines';
import { lineData } from './sample-data';

// The catalog preview: one series with three lines already added, so the
// result is visible before the button is found at the right edge. The dev
// demo next door lists the lines and switches the crosshair mode option.
const chart = createChart('chart', { autoSize: true });

const series = chart.addSeries(LineSeries, { color: '#2962FF' });
const data = lineData(120);
series.setData(data);
chart.timeScale().fitContent();

const lines = new UserPriceLines({ lineColor: '#F23645' });
series.attachPrimitive(lines);
const values = data.map(point => point.value);
const low = Math.min(...values);
const high = Math.max(...values);
for (const share of [0.15, 0.5, 0.85]) {
	lines.addLine(Math.round(low + (high - low) * share));
}

mountControls([
	{
		kind: 'select',
		label: 'Max lines',
		options: ['no limit', '3', '1'],
		onChange: value => lines.applyOptions({ maxLines: value === 'no limit' ? Infinity : Number(value) }),
	},
	{
		kind: 'button',
		label: 'Remove all',
		onClick: () => lines.removeAll(),
	},
]);
