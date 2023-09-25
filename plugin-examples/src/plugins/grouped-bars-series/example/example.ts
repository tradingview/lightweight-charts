import { WhitespaceData, createChart } from 'lightweight-charts';
import { GroupedBarsSeries } from '../grouped-bars-series';
import { GroupedBarsData } from '../data';
import { multipleBarData } from '../../../sample-data';
import { CrosshairHighlightPrimitive } from '../../highlight-bar-crosshair/highlight-bar-crosshair';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		barSpacing: 16,
		minBarSpacing: 8,
	},
}));

const customSeriesView = new GroupedBarsSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	color: 'black', // for the price line
});

const data: (GroupedBarsData | WhitespaceData)[] = multipleBarData(3, 200, 20);
myCustomSeries.setData(data);
myCustomSeries.attachPrimitive(
	new CrosshairHighlightPrimitive({ color: 'rgba(0, 100, 200, 0.2)' })
);
