import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';

import imgUrl from './image.svg';
import { ImageWatermark } from '../image-watermark';

const container = document.querySelector<HTMLDivElement>('#chart');
if (!container) throw new Error('Unable to located container div element');
const chart = ((window as unknown as any).chart = createChart(container, {
	autoSize: true,
}));

const watermark = new ImageWatermark(imgUrl, {
	maxHeight: 400,
	maxWidth: 400,
	padding: 50,
	alpha: 0.4,
});

/**
 * Example of creating a fake 'chart' series.
 * this is a work-around to not having chart primitives.
 *
 * So instead of having chart.attachPrimitive(...) we can recommend this
 * instead if the developer has a reason why a primitive shouldn't be added
 * to a specific series. Not sure why yet, since every chart should have a
 * series to be useful. Maybe if they are dynamically adding and removing series
 * but would like some primitives to always be visible (i.e. a 'chart primitive').
 */
// const chartSeries = chart.addLineSeries();
// chartSeries.attachPrimitive(watermark);

const lineSeries = chart.addLineSeries();
const data = generateLineData();
lineSeries.setData(data);

lineSeries.attachPrimitive(watermark);
