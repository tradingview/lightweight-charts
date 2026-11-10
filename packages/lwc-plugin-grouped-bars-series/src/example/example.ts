import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import { GroupedBarsColumnWidthMode } from '../options';
import { createGroupedBarsSeries } from '../grouped-bars-series';
import { GroupedBarsData } from '../data';
import { groupedBarsData } from './sample-data';

type DemoData = GroupedBarsData | CustomSeriesWhitespaceData<Time>;

// A run of whitespace that leaves a gap, a stretch where the first value turns
// negative, and one point that overrides the color of its second column.
function demoData(groups: number): DemoData[] {
	return groupedBarsData(groups, 90).map((point: GroupedBarsData, index: number): DemoData => {
		if (index >= 30 && index < 34) {
			return { time: point.time };
		}
		if (index >= 50 && index < 60) {
			return { ...point, values: point.values.map((value, column) => (column === 0 && value !== null ? -value : value)) };
		}
		if (index === 70) {
			return { ...point, colors: [undefined, '#131722'] };
		}
		return point;
	});
}

const chart = createChart('chart', {
	autoSize: true,
	timeScale: { barSpacing: 18, minBarSpacing: 6 },
});

const series = createGroupedBarsSeries(chart, {
	color: 'black', // for the price line
});
series.setData(demoData(3));
chart.timeScale().fitContent();

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
