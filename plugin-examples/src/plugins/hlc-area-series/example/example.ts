import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import {
	HLCAreaSeries,
	HLCAreaData,
} from '@tradingview/lwc-plugin-hlc-area-series';
import { generateAlternativeCandleData } from '../../../sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new HLCAreaSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
});

const data: (HLCAreaData | CustomSeriesWhitespaceData<Time>)[] = generateAlternativeCandleData(100);
myCustomSeries.setData(data);
