import {
	ISeriesApi,
	LineSeries,
	PrimitivePaneViewZOrder,
	createChart,
} from 'lightweight-charts';
import { generateLineData } from './sample-data';

import {
	AnchoredText,
	AnchoredTextHorzAlign,
	AnchoredTextVertAlign,
	AnchoredTextPane,
} from '../anchored-text';

const container = document.querySelector<HTMLDivElement>('#chart');
if (!container) throw new Error('Unable to locate container div element');
const chart = ((window as unknown as any).chart = createChart(container, {
	autoSize: true,
}));

const text = new AnchoredText({
	text: 'Anchored Text',
	horzAlign: 'center',
	vertAlign: 'center',
	font: 'italic bold 42px Arial',
	color: '#222222'
});

const data = generateLineData();
const lineSeries = chart.addSeries(LineSeries, { lineWidth: 4 });
lineSeries.setData(data);
lineSeries.attachPrimitive(text);
let attached = true;

function control<T extends HTMLElement>(id: string): T {
	const element = document.querySelector<T>(`#${id}`);
	if (!element) throw new Error(`Missing control: ${id}`);
	return element;
}

const textInput = control<HTMLInputElement>('text');
textInput.addEventListener('input', () => {
	text.setText(textInput.value);
});

const horzAlignSelect = control<HTMLSelectElement>('horz-align');
horzAlignSelect.addEventListener('change', () => {
	text.applyOptions({ horzAlign: horzAlignSelect.value as AnchoredTextHorzAlign });
});

const vertAlignSelect = control<HTMLSelectElement>('vert-align');
vertAlignSelect.addEventListener('change', () => {
	text.applyOptions({ vertAlign: vertAlignSelect.value as AnchoredTextVertAlign });
});

const horzMarginInput = control<HTMLInputElement>('horz-margin');
horzMarginInput.addEventListener('input', () => {
	text.applyOptions({ horzMargin: Number(horzMarginInput.value) });
});

const vertMarginInput = control<HTMLInputElement>('vert-margin');
vertMarginInput.addEventListener('input', () => {
	text.applyOptions({ vertMargin: Number(vertMarginInput.value) });
});

const fontSelect = control<HTMLSelectElement>('font');
fontSelect.addEventListener('change', () => {
	text.applyOptions({ font: fontSelect.value });
});

const colorInput = control<HTMLInputElement>('color');
colorInput.addEventListener('input', () => {
	text.applyOptions({ color: colorInput.value });
});

// The series is drawn with a thick line so that `'bottom'` visibly puts the
// text behind it.
const zOrderSelect = control<HTMLSelectElement>('z-order');
zOrderSelect.addEventListener('change', () => {
	text.applyOptions({ zOrder: zOrderSelect.value as PrimitivePaneViewZOrder });
});

const visibleInput = control<HTMLInputElement>('visible');
visibleInput.addEventListener('change', () => {
	text.applyOptions({ visible: visibleInput.checked });
});

const attachButton = control<HTMLButtonElement>('attach');
attachButton.addEventListener('click', () => {
	if (attached) {
		lineSeries.detachPrimitive(text);
	} else {
		lineSeries.attachPrimitive(text);
	}
	attached = !attached;
	attachButton.textContent = attached ? 'Detach' : 'Attach';
});

// The geometry comes from the pane, so a visible left price scale must not
// move the text.
const leftScaleInput = control<HTMLInputElement>('left-scale');
leftScaleInput.addEventListener('change', () => {
	chart.applyOptions({ leftPriceScale: { visible: leftScaleInput.checked } });
});

// The pane primitive needs no series of its own: it is anchored within the
// pane it is attached to.
const paneText = new AnchoredTextPane({
	text: 'Pane 1',
	horzAlign: 'center',
	vertAlign: 'center',
	color: 'red',
	font: 'bold 24px sans-serif'
});
let secondPaneSeries: ISeriesApi<'Line'> | null = null;

const secondPaneInput = control<HTMLInputElement>('second-pane');
secondPaneInput.addEventListener('change', () => {
	if (secondPaneInput.checked) {
		secondPaneSeries = chart.addSeries(LineSeries, { color: '#222' }, 1);
		secondPaneSeries.setData(
			data.map(point => ({ time: point.time, value: -point.value }))
		);
		chart.panes()[1].attachPrimitive(paneText);
	} else if (secondPaneSeries) {
		chart.panes()[1].detachPrimitive(paneText);
		chart.removeSeries(secondPaneSeries);
		secondPaneSeries = null;
		chart.removePane(1);
	}
});
