import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { TooltipPrimitive } from '../tooltip';

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

const areaSeries = chart.addAreaSeries({
	lineColor: 'rgb(4,153,129)',
	topColor: 'rgba(4,153,129, 0.4)',
	bottomColor: 'rgba(4,153,129, 0)',
	priceLineVisible: false,
});
areaSeries.setData(generateLineData());

const tooltipPrimitive = new TooltipPrimitive({
	lineColor: 'rgba(0, 0, 0, 0.2)',
	tooltip: {
		followMode: 'top',
	},
});

areaSeries.attachPrimitive(tooltipPrimitive);

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
