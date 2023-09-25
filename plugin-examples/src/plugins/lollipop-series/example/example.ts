import { WhitespaceData, createChart } from 'lightweight-charts';
import { generateLineData, shuffleValuesWithLimit } from '../../../sample-data';
import { LollipopSeries } from '../lollipop-series';
import { LollipopData } from '../data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new LollipopSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	lineWidth: 2,
});

const data: (LollipopData | WhitespaceData)[] = shuffleValuesWithLimit(generateLineData(100), 10);
myCustomSeries.setData(data);
