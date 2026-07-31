import { CandlestickSeries, createChart } from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { Trade, TradeVisualization } from '../trade-visualization';

const chart = createChart('chart', {
	autoSize: true,
});

const candleSeries = chart.addSeries(CandlestickSeries);
const data = generateAlternativeCandleData();
candleSeries.setData(data);

const firstOpenPrice = data[150].close;
const secondOpenPrice = data[180].close;
const thirdOpenPrice = data[210].close;

const trades: Trade[] = [
	{
		open: { time: data[150].time, price: firstOpenPrice },
		close: { time: data[165].time, price: firstOpenPrice + 8 },
		stop: firstOpenPrice - 7,
		target: firstOpenPrice + 12,
	},
	{
		open: { time: data[180].time, price: secondOpenPrice },
		close: { time: data[197].time, price: secondOpenPrice - 10 },
		stop: secondOpenPrice + 8,
		target: secondOpenPrice - 14,
	},
	{
		open: { time: data[210].time, price: thirdOpenPrice },
		close: { time: data[228].time, price: thirdOpenPrice + 6 },
		stop: thirdOpenPrice + 9,
		target: thirdOpenPrice - 15,
	},
];

const tradeVisualization = new TradeVisualization(trades, {});
candleSeries.attachPrimitive(tradeVisualization);

chart.timeScale().setVisibleLogicalRange({ from: 140, to: 238 });
