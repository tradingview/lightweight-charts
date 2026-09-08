import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import { StackedBarsSeries, StackedBarsData } from '@tradingview/lwc-plugin-stacked-bars-series';
import { multipleBarData } from '../../../sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		minBarSpacing: 3,
	}
}));

const customSeriesView = new StackedBarsSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	color: 'black', // for the price line
});

const data: (StackedBarsData | CustomSeriesWhitespaceData<Time>)[] = multipleBarData(3, 200, 20);
myCustomSeries.setData(data);
