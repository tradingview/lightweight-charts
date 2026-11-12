import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import { GroupedBarsColumnWidthMode } from '../options';
import { createGroupedBarsSeries } from '../grouped-bars-series';
import { GroupedBarsData } from '../data';
import { groupedBarsData } from './sample-data';

type DemoData = GroupedBarsData | CustomSeriesWhitespaceData<Time>;

// The first value is a net figure that swings above and below zero, the others
// stay positive; a run of whitespace leaves a gap, and one point overrides the
// color of its second column.
function demoData(groups: number): DemoData[] {
	return groupedBarsData(groups, 90).map((point: GroupedBarsData, index: number): DemoData => {
		if (index >= 64 && index < 67) {
			return { time: point.time };
		}
		const net = Math.round((Math.sin(index / 6) * 14 + Math.sin(index / 2.3) * 4) * 10) / 10;
		const values = [net, ...point.values.slice(1)];
		return index === 80 ? { ...point, values, colors: [undefined, '#131722'] } : { ...point, values };
	});
}

// The latest points at a spacing where the columns of a group stand apart;
// scroll back or zoom out for the rest.
const chart = createChart('chart', {
	autoSize: true,
	timeScale: { barSpacing: 26, minBarSpacing: 6 },
});

const series = createGroupedBarsSeries(chart, {
	color: 'black', // for the price line
});
series.setData(demoData(3));

const groups = document.getElementById('groups') as HTMLSelectElement;
const widthMode = document.getElementById('width-mode') as HTMLSelectElement;
const widthPercent = document.getElementById('width-percent') as HTMLInputElement;
const base = document.getElementById('base') as HTMLInputElement;
const hovered = document.getElementById('hovered') as HTMLSpanElement;

groups.addEventListener('change', () => series.setData(demoData(Number(groups.value))));
// `percent` makes each group a share of the bar spacing; `histogram` makes it
// as wide as the built-in histogram's columns.
widthMode.addEventListener('change', () => {
	series.applyOptions({ columnWidthMode: widthMode.value as GroupedBarsColumnWidthMode });
	widthPercent.disabled = widthMode.value !== 'percent';
});
widthPercent.addEventListener('input', () => series.applyOptions({ widthPercent: Number(widthPercent.value) }));
// `base` is part of the autoscale range, so the series rescales to keep it in
// view without setting the data again.
base.addEventListener('input', () => series.applyOptions({ base: Number(base.value) }));

// The series reports the column under the pointer on Lightweight Charts 5.2
// and later: `objectId` is 'column-<point>-<index>'.
chart.subscribeCrosshairMove(param => {
	const info = param.hoveredInfo;
	hovered.textContent = info !== undefined && info.series === series && info.objectId !== undefined
		? `Hovered column: ${String(info.objectId)}`
		: '';
});
