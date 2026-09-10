import { BaselineSeries, createChart } from 'lightweight-charts';
import { addRefreshButton, mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import {
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

// The catalogue preview: no whitespace gap, and a "New data" button because
// the sample data is random. The dev demo next door keeps the gap.
const POINTS = 200;

const chart = createChart('chart', {
	autoSize: true,
	timeScale: { minBarSpacing: 4, barSpacing: 21 },
	hoveredSeriesOnTop: false,
});

const histogram = createDualRangeHistogramSeries(chart, {
	color: 'black', // for the price line
	priceLineVisible: false,
	lastValueVisible: false,
	highlightHovered: true,
});

const baseline = chart.addSeries(BaselineSeries, {
	baseValue: { type: 'price', price: 0 },
	priceLineVisible: false,
	lastValueVisible: false,
});

let data = generateDualRangeHistogramData(POINTS);

function fill(): void {
	data = generateDualRangeHistogramData(POINTS);
	histogram.setData(data);
	baseline.setData(centerLineData(shuffleValuesWithLimit(generateLineData(POINTS), 3)));
}
fill();

// In `pixels` scale mode the series is not part of the autoscale, so the helper
// reserves room for it on the price scale and keeps doing so while resizing.
let stopKeepingInView = keepPixelSeriesInView(chart, histogram);

mountControls([
	{
		kind: 'select',
		label: 'Scale mode',
		options: ['pixels', 'price'],
		onChange: value => {
			stopKeepingInView();
			histogram.applyOptions({ scaleMode: value as DualRangeHistogramScaleMode });
			// The plot values are built when the data is set, so the scale mode
			// only reaches the price scale on the next `setData`.
			histogram.setData(data);
			stopKeepingInView = value === 'pixels'
				? keepPixelSeriesInView(chart, histogram)
				: (): void => {};
		},
	},
	{
		kind: 'select',
		label: 'Normalize',
		options: ['visible', 'all'],
		onChange: value => histogram.applyOptions({ normalize: value as DualRangeHistogramNormalize }),
	},
	{
		kind: 'select',
		label: 'Radius',
		options: ['2', '0', '6', '12'],
		onChange: value => {
			const outer = Number(value);
			histogram.applyOptions({
				borderRadius: {
					upOuter: outer,
					upInner: Math.round(outer / 2),
					downOuter: outer,
					downInner: Math.round(outer / 2),
				},
			});
		},
	},
]);

addRefreshButton(fill);
