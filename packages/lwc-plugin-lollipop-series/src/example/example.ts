import { createChart } from 'lightweight-charts';
import { createLollipopSeries } from '../lollipop-series';
import { lollipopData, withGap } from './sample-data';

const chart = createChart('chart', {
	autoSize: true,
	timeScale: { barSpacing: 12 },
});

const series = createLollipopSeries(chart, {
	color: '#2962FF',
});

// Values on both sides of the base, a run of whitespace that leaves a gap, and
// a per-point color on the negative values.
const data = withGap(lollipopData(120), 50, 56).map(point =>
	'value' in point && point.value < 0 ? { ...point, color: '#F23645' } : point
);
series.setData(data);
chart.timeScale().fitContent();

const base = document.getElementById('base') as HTMLInputElement;
const lineWidth = document.getElementById('line-width') as HTMLInputElement;
const markerSize = document.getElementById('marker-size') as HTMLInputElement;
const hovered = document.getElementById('hovered') as HTMLSpanElement;

function applyControls(): void {
	series.applyOptions({
		// `base` is part of the autoscale range, so the series rescales to keep
		// it in view without setting the data again.
		base: Number(base.value),
		lineWidth: Number(lineWidth.value),
		markerSize: Number(markerSize.value),
	});
}

base.addEventListener('input', applyControls);
lineWidth.addEventListener('input', applyControls);
markerSize.addEventListener('input', applyControls);

// The series reports the lollipop under the pointer on Lightweight Charts 5.2
// and later.
chart.subscribeCrosshairMove(param => {
	const info = param.hoveredInfo;
	hovered.textContent = info !== undefined && info.series === series && info.objectId !== undefined
		? `Hovered: ${String(info.objectId)}`
		: '';
});
