import { ISeriesApi, LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from './sample-data';

import imgUrl from './image.svg';
import {
	ImageWatermark,
	ImageWatermarkPane,
	WatermarkObjectFit,
	WatermarkPosition,
} from '../image-watermark';

const container = document.querySelector<HTMLDivElement>('#chart');
if (!container) throw new Error('Unable to located container div element');
const chart = ((window as unknown as any).chart = createChart(container, {
	autoSize: true,
}));

const watermark = new ImageWatermark(imgUrl, {
	maxHeight: 400,
	maxWidth: 400,
	padding: 20,
	alpha: 0.4,
});

const data = generateLineData();
const lineSeries = chart.addSeries(LineSeries);
lineSeries.setData(data);
lineSeries.attachPrimitive(watermark);
let attached = true;

function control<T extends HTMLElement>(id: string): T {
	const element = document.querySelector<T>(`#${id}`);
	if (!element) throw new Error(`Missing control: ${id}`);
	return element;
}

const positionSelect = control<HTMLSelectElement>('position');
positionSelect.addEventListener('change', () => {
	watermark.applyOptions({
		position: positionSelect.value as WatermarkPosition,
	});
});

const objectFitSelect = control<HTMLSelectElement>('object-fit');
objectFitSelect.addEventListener('change', () => {
	watermark.applyOptions({
		objectFit: objectFitSelect.value as WatermarkObjectFit,
	});
});

const alphaInput = control<HTMLInputElement>('alpha');
alphaInput.addEventListener('input', () => {
	watermark.applyOptions({ alpha: Number(alphaInput.value) });
});

// The watermark keeps the image it has decoded, so re-attaching redraws it
// without a second request.
const attachButton = control<HTMLButtonElement>('attach');
attachButton.addEventListener('click', () => {
	if (attached) {
		lineSeries.detachPrimitive(watermark);
	} else {
		lineSeries.attachPrimitive(watermark);
	}
	attached = !attached;
	attachButton.textContent = attached ? 'Detach' : 'Attach';
});

// The geometry comes from the pane, so a visible left price scale must not
// move the watermark.
const leftScaleInput = control<HTMLInputElement>('left-scale');
leftScaleInput.addEventListener('change', () => {
	chart.applyOptions({ leftPriceScale: { visible: leftScaleInput.checked } });
});

// The pane primitive needs no series of its own: it fills the pane it is
// attached to.
const paneWatermark = new ImageWatermarkPane(imgUrl, {
	position: 'bottom-right',
	objectFit: 'none',
	maxWidth: 120,
	maxHeight: 120,
	padding: 8,
	alpha: 0.5,
});
let secondPaneSeries: ISeriesApi<'Line'> | null = null;

const secondPaneInput = control<HTMLInputElement>('second-pane');
secondPaneInput.addEventListener('change', () => {
	if (secondPaneInput.checked) {
		secondPaneSeries = chart.addSeries(LineSeries, { color: '#F23645' }, 1);
		secondPaneSeries.setData(
			data.map(point => ({ time: point.time, value: -point.value }))
		);
		chart.panes()[1].attachPrimitive(paneWatermark);
	} else if (secondPaneSeries) {
		chart.panes()[1].detachPrimitive(paneWatermark);
		chart.removeSeries(secondPaneSeries);
		secondPaneSeries = null;
		chart.removePane(1);
	}
});
