import { CandlestickSeries, Time, createChart } from 'lightweight-charts';
import { addRefreshButton, mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { SessionHighlighter, SessionHighlighting } from '../session-highlighting';
import { generateCandleData } from './sample-data';

// The catalogue preview: daily candles with weekends shaded. The dev demo next
// door adds the layer, bar spacing, left price scale, second pane and
// incremental-update controls.
const chart = createChart('chart', { autoSize: true, timeScale: { barSpacing: 10 } });

const dayOf = (time: Time) => new Date((time as number) * 1000).getUTCDay();

const highlighters: Record<string, SessionHighlighter> = {
	weekends: time => (dayOf(time) === 0 || dayOf(time) === 6 ? 'rgba(255, 152, 1, 0.2)' : 'rgba(41, 98, 255, 0.06)'),
	'weekends only': time => (dayOf(time) === 0 || dayOf(time) === 6 ? 'rgba(255, 152, 1, 0.2)' : ''),
	'alternate days': time => (Math.round((time as number) / 86400) % 2 === 0 ? 'rgba(41, 98, 255, 0.12)' : ''),
};

const highlighting = new SessionHighlighting(highlighters.weekends);

const series = chart.addSeries(CandlestickSeries);
series.setData(generateCandleData(200));
series.attachPrimitive(highlighting);
chart.timeScale().scrollToRealTime();
let attached = true;

mountControls([
	{
		kind: 'select',
		label: 'Highlighter',
		options: Object.keys(highlighters),
		onChange: value => highlighting.setHighlighter(highlighters[value]),
	},
	{
		kind: 'select',
		label: 'Layer',
		options: ['bottom', 'normal', 'top'],
		onChange: value => highlighting.applyOptions({ zOrder: value as 'bottom' | 'normal' | 'top' }),
	},
	{
		kind: 'button',
		label: 'Detach',
		onClick: button => {
			if (attached) {
				series.detachPrimitive(highlighting);
			} else {
				series.attachPrimitive(highlighting);
			}
			attached = !attached;
			button.textContent = attached ? 'Detach' : 'Attach';
		},
	},
]);

addRefreshButton(() => {
	series.setData(generateCandleData(200));
	chart.timeScale().scrollToRealTime();
});
