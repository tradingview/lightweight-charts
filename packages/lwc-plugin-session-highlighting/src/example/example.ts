import {
	CandlestickSeries,
	ISeriesApi,
	LineSeries,
	PrimitivePaneViewZOrder,
	Time,
	createChart,
	isBusinessDay,
	isUTCTimestamp,
} from 'lightweight-charts';
import { CandleData, generateCandleData } from './sample-data';

import { SessionHighlighter, SessionHighlighting } from '../session-highlighting';

const container = document.querySelector<HTMLDivElement>('#chart');
if (!container) throw new Error('Unable to locate container div element');
const chart = ((window as unknown as any).chart = createChart(container, {
	autoSize: true,
	timeScale: { barSpacing: 8 },
}));

function toDate(time: Time): Date {
	if (isUTCTimestamp(time)) {
		return new Date(time * 1000);
	}
	if (isBusinessDay(time)) {
		return new Date(Date.UTC(time.year, time.month - 1, time.day));
	}
	return new Date(time);
}

const highlighters: Record<string, SessionHighlighter> = {
	weekends: time => {
		const day = toDate(time).getUTCDay();
		return day === 0 || day === 6 ? 'rgba(255, 152, 1, 0.2)' : 'rgba(41, 98, 255, 0.06)';
	},
	alternate: time => (Math.round((time as number) / 86400) % 2 === 0 ? 'rgba(41, 98, 255, 0.12)' : ''),
	'month-start': time => (toDate(time).getUTCDate() <= 7 ? 'rgba(8, 153, 129, 0.15)' : ''),
	none: () => '',
};

const highlighting = new SessionHighlighting(highlighters.weekends);

const data = generateCandleData(300);
const candles = chart.addSeries(CandlestickSeries);
candles.setData(data);
candles.attachPrimitive(highlighting);
let attached = true;

function control<T extends HTMLElement>(id: string): T {
	const element = document.querySelector<T>(`#${id}`);
	if (!element) throw new Error(`Missing control: ${id}`);
	return element;
}

const highlighterSelect = control<HTMLSelectElement>('highlighter');
highlighterSelect.addEventListener('change', () => {
	highlighting.setHighlighter(highlighters[highlighterSelect.value]);
	paneHighlighting.setHighlighter(highlighters[highlighterSelect.value]);
});

const zOrderSelect = control<HTMLSelectElement>('z-order');
zOrderSelect.addEventListener('change', () => {
	highlighting.applyOptions({ zOrder: zOrderSelect.value as PrimitivePaneViewZOrder });
});

// The columns are as wide as the time scale's bar spacing, so zooming never
// leaves seams or overlaps between neighbouring bars.
const barSpacingInput = control<HTMLInputElement>('bar-spacing');
barSpacingInput.addEventListener('input', () => {
	chart.timeScale().applyOptions({ barSpacing: Number(barSpacingInput.value) });
});

const visibleInput = control<HTMLInputElement>('visible');
visibleInput.addEventListener('change', () => {
	highlighting.applyOptions({ visible: visibleInput.checked });
});

// The geometry comes from the pane, so a visible left price scale must not
// move the columns.
const leftScaleInput = control<HTMLInputElement>('left-scale');
leftScaleInput.addEventListener('change', () => {
	chart.applyOptions({ leftPriceScale: { visible: leftScaleInput.checked } });
});

// An incremental update asks the highlighter for the new bar only.
const appendButton = control<HTMLButtonElement>('append');
appendButton.addEventListener('click', () => {
	const last = data[data.length - 1];
	const next: CandleData = {
		time: ((last.time as number) + 86400) as Time,
		open: last.close,
		high: last.close * 1.03,
		low: last.close * 0.97,
		close: last.close * (0.98 + Math.random() * 0.04),
	};
	data.push(next);
	candles.update(next);
	if (secondPaneSeries) {
		secondPaneSeries.update({ time: next.time, value: next.close - next.open });
	}
});

const attachButton = control<HTMLButtonElement>('attach');
attachButton.addEventListener('click', () => {
	if (attached) {
		candles.detachPrimitive(highlighting);
	} else {
		candles.attachPrimitive(highlighting);
	}
	attached = !attached;
	attachButton.textContent = attached ? 'Detach' : 'Attach';
});

// A second pane: the shading belongs to the series it is attached to, so the
// lower pane needs a highlighting of its own.
const paneHighlighting = new SessionHighlighting(highlighters.weekends);
let secondPaneSeries: ISeriesApi<'Line'> | null = null;

const secondPaneInput = control<HTMLInputElement>('second-pane');
secondPaneInput.addEventListener('change', () => {
	if (secondPaneInput.checked) {
		secondPaneSeries = chart.addSeries(LineSeries, { color: '#F23645' }, 1);
		secondPaneSeries.setData(data.map(bar => ({ time: bar.time, value: bar.close - bar.open })));
		secondPaneSeries.attachPrimitive(paneHighlighting);
	} else if (secondPaneSeries) {
		secondPaneSeries.detachPrimitive(paneHighlighting);
		chart.removeSeries(secondPaneSeries);
		secondPaneSeries = null;
		chart.removePane(1);
	}
});
