import { createChart } from 'lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { CrosshairHighlightPrimitive } from '../highlight-bar-crosshair';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const candleSeries = chart.addCandlestickSeries();
candleSeries.setData(generateAlternativeCandleData());

const highlightPrimitive = new CrosshairHighlightPrimitive({
	color: 'rgba(0, 50, 100, 0.2)',
});

candleSeries.attachPrimitive(highlightPrimitive);
