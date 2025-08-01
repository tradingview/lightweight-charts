import { BaselineSeries, createChart } from 'lightweight-charts';
import { DualRangeHistogramSeries } from '../dual-range-histogram-series';
import { generateLineData, shuffleValuesWithLimit } from '../../../sample-data';
import { centerLineData, generateDualRangeHistogramData } from './sample-data';

const numberPoints = 200;

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		minBarSpacing: 4,
		barSpacing: 21,
	},
}));

const dualRangeHistogramSeriesView = new DualRangeHistogramSeries();
const dualRangeHistogramSeries = chart.addCustomSeries(
	dualRangeHistogramSeriesView,
	{
		/* Options */
		color: 'black', // for the price line,
		priceLineVisible: false,
		lastValueVisible: false,
	}
);

const data = generateDualRangeHistogramData(numberPoints);
dualRangeHistogramSeries.setData(data);

const baselineSeries = chart.addSeries(BaselineSeries, {
	baseValue: { type: 'price', price: 0 },
});
const lineData = centerLineData(
	shuffleValuesWithLimit(generateLineData(numberPoints), 3)
);
baselineSeries.setData(lineData);

// The following code is for ensuring that the histogram remains in view
// because we are purposely not telling the library the priceValues so
// it doesn't adjust the price scale normally. This is so we can keep the
// series on the zero line of the main price scale but not affect it's scaling
function setPriceScaleMargins(): void {
	const { height } = chart.paneSize();
	const seriesHeight = dualRangeHistogramSeries.options().maxHeight;
	const margin = Math.min(0.3, seriesHeight / 2 / height);
	dualRangeHistogramSeries.priceScale().applyOptions({
		scaleMargins: {
			top: margin,
			bottom: margin,
		},
	});
}
const resizeObserver = new ResizeObserver(_ => {
	setPriceScaleMargins();
});
resizeObserver.observe(chart.chartElement());
setPriceScaleMargins();
