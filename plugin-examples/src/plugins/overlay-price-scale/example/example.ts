import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { OverlayPriceScale } from '../overlay-price-scale';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	rightPriceScale: {
		visible: false,
	},
	grid: {
		horzLines: {
			visible: false,
		},
	},
}));

const lineSeries = chart.addAreaSeries({
	priceScaleId: 'overlay',
});

const data = generateLineData();
lineSeries.setData(data);

lineSeries.attachPrimitive(new OverlayPriceScale({}));
