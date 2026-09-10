import { BaselineSeries, WhitespaceData, createChart } from 'lightweight-charts';
import {
	DualRangeHistogramData,
	DualRangeHistogramNormalize,
	DualRangeHistogramScaleMode,
	createDualRangeHistogramSeries,
	keepPixelSeriesInView,
} from '../dual-range-histogram-series';
import {
	centerLineData,
	generateDualRangeHistogramData,
	generateLineData,
	shuffleValuesWithLimit,
} from './sample-data';

const numberPoints = 200;

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		minBarSpacing: 4,
		barSpacing: 21,
	},
	hoveredSeriesOnTop: false,
}));

const dualRangeHistogramSeries = createDualRangeHistogramSeries(chart,
	{
		color: 'black', // for the price line
		priceLineVisible: false,
		lastValueVisible: false,
		highlightHovered: true,
	}
);

// A gap of whitespace, so that the columns around it keep their own width and
// position instead of being aligned across the gap.
const data: (DualRangeHistogramData | WhitespaceData)[] =
	generateDualRangeHistogramData(numberPoints).map((point, index: number) =>
		index >= 120 && index < 130 ? { time: point.time } : point
	);
dualRangeHistogramSeries.setData(data);

const baselineSeries = chart.addSeries(BaselineSeries, {
	baseValue: { type: 'price', price: 0 },
});
baselineSeries.setData(
	centerLineData(shuffleValuesWithLimit(generateLineData(numberPoints), 3))
);

// In `pixels` scale mode the series is not part of the autoscale, so the helper
// reserves room for it on the price scale and keeps doing so while resizing.
let stopKeepingInView = keepPixelSeriesInView(chart, dualRangeHistogramSeries);

function control(id: string): HTMLInputElement {
	return document.getElementById(id) as HTMLInputElement;
}

const scaleMode = document.getElementById('scale-mode') as HTMLSelectElement;
scaleMode.onchange = () => {
	stopKeepingInView();
	dualRangeHistogramSeries.applyOptions({
		scaleMode: scaleMode.value as DualRangeHistogramScaleMode,
	});
	// The plot values are built when the data is set, so the scale mode only
	// reaches the price scale on the next `setData`.
	dualRangeHistogramSeries.setData(data);
	stopKeepingInView =
		scaleMode.value === 'pixels'
			? keepPixelSeriesInView(chart, dualRangeHistogramSeries)
			: () => {};
};

const normalize = document.getElementById('normalize') as HTMLSelectElement;
normalize.onchange = () => {
	const value = normalize.value;
	dualRangeHistogramSeries.applyOptions({
		normalize: (value === 'fixed'
			? 400
			: value) as DualRangeHistogramNormalize,
	});
};

const radius = control('radius');
const radiusValue = document.getElementById('radius-value') as HTMLOutputElement;
radius.oninput = () => {
	radiusValue.value = radius.value;
	const outer = Number(radius.value);
	dualRangeHistogramSeries.applyOptions({
		borderRadius: {
			upOuter: outer,
			upInner: Math.round(outer / 2),
			downOuter: outer,
			downInner: Math.round(outer / 2),
		},
	});
};

const gap = control('gap');
const gapValue = document.getElementById('gap-value') as HTMLOutputElement;
gap.oninput = () => {
	gapValue.value = gap.value;
	dualRangeHistogramSeries.applyOptions({ gap: Number(gap.value) });
};
