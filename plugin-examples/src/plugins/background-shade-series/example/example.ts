import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { BackgroundShadeSeries } from '../background-shade-series';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const data = generateLineData();

const customSeriesView = new BackgroundShadeSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
    lowValue: 0,
    highValue: 1000,
});

myCustomSeries.setData(data);

const lineSeries = chart.addLineSeries({ color: 'black' });
lineSeries.setData(data);
