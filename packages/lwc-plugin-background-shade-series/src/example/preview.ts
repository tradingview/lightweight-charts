import { CandlestickSeries, createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { createBackgroundShadeSeries } from '../background-shade-series';
import { candleData, upShare } from './sample-data';

// The catalog preview: candles over a shading from the share of up-closing
// bars. The dev demo next door adds a whitespace gap.
const chart = createChart('chart', { autoSize: true });

const candles = candleData(120);
const candleSeries = chart.addSeries(CandlestickSeries);
candleSeries.setData(candles);

const shade = createBackgroundShadeSeries(chart, {
	lowColor: '#F23645',
	highColor: '#089981',
	opacity: 0.25,
});
shade.setData(upShare(candles));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Colors',
		options: [
			{ value: 'red-green', label: 'red → green' },
			{ value: 'blue-red', label: 'blue → red' },
		],
		onChange: value =>
			shade.applyOptions(
				value === 'red-green'
					? { lowColor: '#F23645', highColor: '#089981' }
					: { lowColor: 'rgb(50, 50, 255)', highColor: 'rgb(255, 50, 50)' }
			),
	},
	{
		kind: 'select',
		label: 'Opacity',
		options: ['0.25', '0.5', '0.1'],
		onChange: value => shade.applyOptions({ opacity: Number(value) }),
	},
]);
