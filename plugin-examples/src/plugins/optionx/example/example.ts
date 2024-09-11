import { createChart } from 'lightweight-charts';
import { generateAlternativeCandleData, generateOptionPrices } from '../../../sample-data';
import { TooltipPrimitive } from '../tooltip-primitive';

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
		followMode: 'top',
	},
});

candlestickSeries.attachPrimitive(tooltipPrimitive);

const optioncandlestickSeries = chart.addCandlestickSeries();
optioncandlestickSeries.setData(generateOptionPrices(alternateCandleData[alternateCandleData.length - 1].close + 10));

optioncandlestickSeries.attachPrimitive(tooltipPrimitive);

const trackingButtonEl = document.querySelector('#tracking-button');
if (trackingButtonEl) trackingButtonEl.classList.add('grey');
const topButtonEl = document.querySelector('#top-button');
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
