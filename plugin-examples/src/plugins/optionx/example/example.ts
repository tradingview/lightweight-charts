import { createChart } from 'lightweight-charts';
import { generateAlternativeCandleData, generateOptionPrices } from '../../../sample-data';
import { TooltipPrimitive } from '../tooltip-primitive';
import { OptionPriceSeries } from '../../option-price-series/option-price-series';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
	timeScale: {
		borderVisible: false,
	},
	rightPriceScale: {
		borderVisible: false,
	},
}));

// const areaSeries = chart.addAreaSeries({
// 	lineColor: 'rgb(4,153,129)',
// 	topColor: 'rgba(4,153,129, 0.4)',
// 	bottomColor: 'rgba(4,153,129, 0)',
// 	priceLineVisible: false,
// });
// areaSeries.setData(generateLineData());


// create candlestick series
const candlestickSeries = chart.addCandlestickSeries();
const alternateCandleData = generateAlternativeCandleData();
candlestickSeries.setData(alternateCandleData);

const tooltipPrimitive = new TooltipPrimitive({
	lineColor: 'rgba(0, 0, 0, 0.2)',
	tooltip: {
		followMode: 'tracking',
	},
});

// not attaching tooltip to stock candle stick
// candlestickSeries.attachPrimitive(tooltipPrimitive);

const customSeriesView = new OptionPriceSeries();
const optionPriceSeries = chart.addCustomSeries(customSeriesView, {
	color: '#FF00FF', // TESTING: shouldn't see this because we are coloring each bar later
});

// const optioncandlestickSeries = chart.addCandlestickSeries();
optionPriceSeries.setData(generateOptionPrices(alternateCandleData[alternateCandleData.length - 1].close + 10));

optionPriceSeries.attachPrimitive(tooltipPrimitive);

const trackingButtonEl = document.querySelector('#tracking-button');
const topButtonEl = document.querySelector('#top-button');
// default to tracking
if (topButtonEl) topButtonEl.classList.add('grey');

if (trackingButtonEl) {
	trackingButtonEl.addEventListener('click', function () {
		trackingButtonEl.classList.remove('grey');
		if (topButtonEl) topButtonEl.classList.add('grey');
		tooltipPrimitive.applyOptions({
			tooltip: {
				followMode: 'tracking',
			},
		});
	});
}

if (topButtonEl) {
	topButtonEl.addEventListener('click', function () {
		topButtonEl.classList.remove('grey');
		if (trackingButtonEl) trackingButtonEl.classList.add('grey');
		tooltipPrimitive.applyOptions({
			tooltip: {
				followMode: 'top',
			},
		});
	});
}
