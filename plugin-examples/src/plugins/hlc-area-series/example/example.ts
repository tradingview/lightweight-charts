import { WhitespaceData, createChart } from 'lightweight-charts';
import { HLCAreaSeries } from '../hlc-area-series';
import { HLCAreaData } from '../data';
import { generateAlternativeCandleData } from '../../../sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new HLCAreaSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
});

const data: (HLCAreaData | WhitespaceData)[] = generateAlternativeCandleData(100);
myCustomSeries.setData(data);
