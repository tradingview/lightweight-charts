import { ISeriesApi, LineSeries, LineStyle, Time, createChart } from 'lightweight-charts';
import { addRefreshButton, mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { VerticalLine } from '../vertical-line';
import { VerticalLineSnap } from '../options';
import { generateLineData } from './sample-data';

// The catalogue preview: two lines on real bars, both drawn with the default
// `snap: 'nearest'`. The dev demo next door keeps the between-bars line and the
// one past the end of the data, which are there to show what is not drawn.
const chart = createChart('chart', { autoSize: true });

const series = chart.addSeries(LineSeries);
let data = generateLineData(200);
series.setData(data);

/** Colour of the line and of its axis label: the default label is green. */
function line(time: Time, color: string, text: string): VerticalLine {
	return new VerticalLine(time, {
		showLabel: true,
		color,
		labelBackgroundColor: color,
		width: 2,
		lineStyle: LineStyle.Dashed,
		snap: 'nearest',
		badge: { text, backgroundColor: color },
	});
}

const draggable = line(data[60].time, '#089981', 'Drag me');
draggable.applyOptions({ draggable: true });
series.attachPrimitive(draggable);

const marker = line(data[130].time, '#2962FF', 'Event');
series.attachPrimitive(marker);

const lines = [draggable, marker];

// A second pane, added on demand: a line only spans the pane of the series it
// is attached to, so marking a time across panes needs one line per pane.
let paneSeries: ISeriesApi<'Line'> | null = null;
let paneLine: VerticalLine | null = null;

function setSecondPane(enabled: boolean): void {
	if (enabled) {
		paneSeries = chart.addSeries(LineSeries, { color: '#F23645' }, 1);
		paneSeries.setData(data.map(point => ({ time: point.time, value: 200 - point.value / 4 })));
		paneLine = line(data[160].time, '#FF9800', 'Pane 1');
		paneSeries.attachPrimitive(paneLine);
	} else if (paneSeries !== null) {
		if (paneLine !== null) {
			paneSeries.detachPrimitive(paneLine);
			paneLine = null;
		}
		chart.removeSeries(paneSeries);
		paneSeries = null;
		chart.removePane(1);
	}
}

mountControls([
	{
		kind: 'select',
		label: 'Snap',
		options: ['nearest', 'exact'],
		onChange: value => lines.concat(paneLine ?? []).forEach(item => item.applyOptions({ snap: value as VerticalLineSnap })),
	},
	{
		kind: 'select',
		label: 'Label',
		options: [
			{ value: 'time', label: 'chart time format' },
			{ value: 'text', label: 'custom text' },
			{ value: 'none', label: 'hidden' },
		],
		onChange: mode => lines.concat(paneLine ?? []).forEach(item => item.applyOptions({
			showLabel: mode !== 'none',
			// An empty `labelText` falls back to the chart's own time format.
			labelText: mode === 'text' ? 'Event' : '',
		})),
	},
	{
		kind: 'checkbox',
		label: 'Second pane',
		onChange: setSecondPane,
	},
]);

addRefreshButton(() => {
	data = generateLineData(200);
	series.setData(data);
	if (paneSeries !== null) {
		paneSeries.setData(data.map(point => ({ time: point.time, value: 200 - point.value / 4 })));
	}
	chart.timeScale().fitContent();
});

chart.timeScale().fitContent();
