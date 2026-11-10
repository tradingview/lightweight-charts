import { WhitespaceData, createChart } from 'lightweight-charts';
import { WhiskerBoxSeries } from '../box-whisker-series';
import { WhiskerData, sampleWhiskerData } from '../sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new WhiskerBoxSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	baseLineColor: '',
	priceLineVisible: false,
	lastValueVisible: false,
});

const data: (WhiskerData | WhitespaceData)[] = sampleWhiskerData();
// data[data.length -2] = { time: data[data.length -2].time }; // test whitespace data
myCustomSeries.setData(data);

chart.timeScale().fitContent();
