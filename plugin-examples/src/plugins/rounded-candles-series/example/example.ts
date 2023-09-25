import { WhitespaceData, createChart } from 'lightweight-charts';
import { CandleData, generateAlternativeCandleData } from '../../../sample-data';
import { RoundedCandleSeries } from '../rounded-candles-series';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const customSeriesView = new RoundedCandleSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	color: '#FF00FF', // TESTING: shouldn't see this because we are coloring each bar later
});

const { upColor, downColor } = myCustomSeries.options();

let lastValue = -Infinity;
const data: (CandleData | WhitespaceData)[] = generateAlternativeCandleData().map(d => {
	// we add the item colors here instead of providing an
	// API to do it internally.
	const color = d.close >= lastValue ? upColor : downColor;
	lastValue = d.close;
	return { ...d, color };
});
data[data.length -2] = { time: data[data.length -2].time }; // test whitespace data
myCustomSeries.setData(data);

// Should be an error...
// myCustomSeries.update({
// 	time: 123456 as Time,
// 	close: 1234,
// 	open: 1234,
// });
