import { BaselineSeries, WhitespaceData, createChart } from 'lightweight-charts';
import {
	DualRangeHistogramData,
	DualRangeHistogramNormalize,
	DualRangeHistogramScaleMode,
	createDualRangeHistogramSeries,
	keepPixelSeriesInView,
} from '@tradingview/lwc-plugin-dual-range-histogram-series';
import { generateLineData, shuffleValuesWithLimit } from '../../../sample-data';
import { centerLineData, generateDualRangeHistogramData } from './sample-data';

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

const scaleModeElement = document.getElementById('scaleMode') as HTMLSelectElement;
scaleModeElement.onchange = () => {
	stopKeepingInView();
	dualRangeHistogramSeries.applyOptions({
		scaleMode: scaleModeElement.value as DualRangeHistogramScaleMode,
	});
	// The plot values are built when the data is set, so the scale mode only
	// reaches the price scale on the next `setData`.
	dualRangeHistogramSeries.setData(data);
	stopKeepingInView =
		scaleModeElement.value === 'pixels'
			? keepPixelSeriesInView(chart, dualRangeHistogramSeries)
			: () => {};
};

const normalizeElement = document.getElementById('normalize') as HTMLSelectElement;
normalizeElement.onchange = () => {
	const value = normalizeElement.value;
	dualRangeHistogramSeries.applyOptions({
		normalize: (value === 'fixed' ? 400 : value) as DualRangeHistogramNormalize,
	});
};

const radiusElement = document.getElementById('radius') as HTMLInputElement;
radiusElement.value = dualRangeHistogramSeries
	.options()
	.borderRadius.upOuter.toString();
radiusElement.onchange = () => {
	const outer = parseFloat(radiusElement.value);
	if (!isNaN(outer) && outer >= 0) {
		dualRangeHistogramSeries.applyOptions({
			borderRadius: {
				upOuter: outer,
				upInner: Math.round(outer / 2),
				downOuter: outer,
				downInner: Math.round(outer / 2),
			},
		});
	}
};

const gapElement = document.getElementById('gap') as HTMLInputElement;
gapElement.value = dualRangeHistogramSeries.options().gap.toString();
gapElement.onchange = () => {
	const gap = parseFloat(gapElement.value);
	if (!isNaN(gap) && gap >= 0) {
		dualRangeHistogramSeries.applyOptions({ gap });
	}
};
