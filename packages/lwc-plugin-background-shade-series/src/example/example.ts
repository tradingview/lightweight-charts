import { CandlestickSeries, createChart } from 'lightweight-charts';
import { createBackgroundShadeSeries } from '../background-shade-series';
import { candleData, upShare } from './sample-data';

const palettes: Record<string, { lowColor: string; highColor: string }> = {
	'blue-red': { lowColor: 'rgb(50, 50, 255)', highColor: 'rgb(255, 50, 50)' },
	'red-green': { lowColor: '#F23645', highColor: '#089981' },
	'transparent-orange': { lowColor: 'rgba(255, 152, 0, 0)', highColor: '#FF9800' },
};

const chart = createChart('chart', {
	autoSize: true,
});

const candles = candleData(200);
// The candles are added first; the factory still puts the shading behind them.
const candleSeries = chart.addSeries(CandlestickSeries);
candleSeries.setData(candles);

const shade = createBackgroundShadeSeries(chart, {
	...palettes['blue-red'],
	opacity: 0.3,
});
// The share of up-closing bars over the last 14, with a gap of whitespace and
// one bar given its own color.
shade.setData(
	upShare(candles).map((point, index) => {
		if (index >= 120 && index < 126) {
			return { time: point.time };
		}
		return index === 150 ? { ...point, color: '#131722' } : point;
	})
);
chart.timeScale().fitContent();

const colors = document.getElementById('colors') as HTMLSelectElement;
const opacity = document.getElementById('opacity') as HTMLInputElement;
const range = document.getElementById('range') as HTMLSelectElement;

colors.addEventListener('change', () => shade.applyOptions(palettes[colors.value]));
opacity.addEventListener('input', () => shade.applyOptions({ opacity: Number(opacity.value) }));
range.addEventListener('change', () => {
	const [lowValue, highValue] = range.value.split('-').map(Number);
	shade.applyOptions({ lowValue, highValue });
});
