import { LineSeries, LineStyle, Time, createChart } from 'lightweight-charts';
import { generateLineData } from './sample-data';
import { VerticalLine } from '../vertical-line';
import { VerticalLineSnap } from '../options';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries);
const data = generateLineData(200);
lineSeries.setData(data);

// A second pane: a vertical line only spans the pane of the series it is
// attached to, so marking a time across panes needs one line per pane.
const secondPaneSeries = chart.addSeries(LineSeries, { color: '#F23645' }, 1);
secondPaneSeries.setData(
	data.map((point: { time: Time; value: number }) => ({
		time: point.time,
		value: 200 - point.value / 4,
	}))
);

// A time that is a bar of the series.
const onBar = new VerticalLine(data[60].time, {
	showLabel: true,
	color: '#089981',
	labelBackgroundColor: '#089981',
	width: 2,
	lineStyle: LineStyle.Dashed,
	snap: 'nearest',
	draggable: true,
	badge: { text: 'Drag me', backgroundColor: '#089981' },
});
lineSeries.attachPrimitive(onBar);

// A time halfway between two bars: with `snap: 'exact'` there is no coordinate
// for it and neither the line nor its label is drawn.
const betweenBars = new VerticalLine(
	(((data[120].time as number) + (data[121].time as number)) / 2) as Time,
	{
		showLabel: true,
		color: '#2962FF',
		labelBackgroundColor: '#2962FF',
		width: 2,
		lineStyle: LineStyle.Dashed,
		snap: 'nearest',
		badge: { text: 'Between bars', backgroundColor: '#2962FF' },
	}
);
lineSeries.attachPrimitive(betweenBars);

// A time a month past the end of the data: with `snap: 'exact'` there is no
// coordinate for it, so nothing is drawn and no stray label is left at the left
// edge of the axis; with `'nearest'` it lands on the last bar.
const outsideData = new VerticalLine(
	((data[data.length - 1].time as number) + 86400 * 30) as Time,
	{
		showLabel: true,
		color: '#9C27B0',
		labelBackgroundColor: '#9C27B0',
		width: 2,
		lineStyle: LineStyle.Dashed,
		snap: 'nearest',
		badge: { text: 'Outside data', backgroundColor: '#9C27B0' },
	}
);
lineSeries.attachPrimitive(outsideData);

const secondPaneLine = new VerticalLine(data[160].time, {
	showLabel: true,
	color: '#FF9800',
	labelBackgroundColor: '#FF9800',
	width: 2,
	lineStyle: LineStyle.Dashed,
	snap: 'nearest',
	badge: { text: 'Pane 1', backgroundColor: '#FF9800' },
});
secondPaneSeries.attachPrimitive(secondPaneLine);

const lines = [onBar, betweenBars, outsideData, secondPaneLine];

const lineStyleSelect = document.getElementById(
	'line-style'
) as HTMLSelectElement;
const snapSelect = document.getElementById('snap') as HTMLSelectElement;
const labelSelect = document.getElementById('label') as HTMLSelectElement;
const draggableInput = document.getElementById('draggable') as HTMLInputElement;

lineStyleSelect.addEventListener('change', () => {
	const lineStyle = Number(lineStyleSelect.value) as LineStyle;
	lines.forEach(line => line.applyOptions({ lineStyle }));
});

snapSelect.addEventListener('change', () => {
	const snap = snapSelect.value as VerticalLineSnap;
	lines.forEach(line => line.applyOptions({ snap }));
});

labelSelect.addEventListener('change', () => {
	const mode = labelSelect.value;
	lines.forEach(line =>
		line.applyOptions({
			showLabel: mode !== 'none',
			// An empty `labelText` falls back to the chart's own time format.
			labelText: mode === 'text' ? 'Event' : '',
		})
	);
});

draggableInput.addEventListener('change', () => {
	onBar.applyOptions({ draggable: draggableInput.checked });
});

chart.timeScale().fitContent();
