import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { DeltaTooltipPrimitive } from '../delta-tooltip';

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
	handleScale: false,
	handleScroll: false,
}));

const areaSeries = chart.addAreaSeries({
	lineColor: 'rgb(40,98,255)',
	topColor: 'rgba(40,98,255, 0.4)',
	bottomColor: 'rgba(40,98,255, 0)',
	priceLineVisible: false,
});
areaSeries.setData(generateLineData());

const tooltipPrimitive = new DeltaTooltipPrimitive({
	lineColor: 'rgba(0, 0, 0, 0.2)',
});

areaSeries.attachPrimitive(tooltipPrimitive);

chart.timeScale().fitContent();
