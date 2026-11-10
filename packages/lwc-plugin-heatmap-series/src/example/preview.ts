import { LineSeries, createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { HeatmapCellShader, createColorScale, createHeatmapSeries } from '../heatmap-series';
import { orderBookData } from './sample-data';

// The catalog preview: an order book through time, the size resting at each
// price level around the mid price, with large orders standing out until the
// price trades through them. The dev demo next door has more options, a
// volume profile, and shows the hovered cell.
// hoveredSeriesOnTop off keeps the mid price line on top while the heatmap is hovered.
const chart = createChart('chart', {
	autoSize: true,
	timeScale: { timeVisible: true },
	hoveredSeriesOnTop: false,
});

// The scales spread their colors over the amounts in view.
const scales: Record<string, HeatmapCellShader> = {
	heat: createColorScale({ stops: ['rgba(41, 98, 255, 0.05)', 'rgba(41, 98, 255, 0.55)', '#F7A600', '#F23645'] }),
	blue: createColorScale({ stops: ['rgba(41, 98, 255, 0.05)', 'rgba(41, 98, 255, 1)'], steps: 16 }),
};

const { mid, book } = orderBookData(150);
const heatmap = createHeatmapSeries(chart, { cellShader: scales.heat, cellGap: 0 });
heatmap.setData(book);
chart.addSeries(LineSeries, { color: '#131722', lineWidth: 2, priceLineVisible: false }).setData(mid);
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Colors',
		options: ['heat', 'blue'],
		onChange: value => heatmap.applyOptions({ cellShader: scales[value] }),
	},
	{
		kind: 'select',
		label: 'Gap',
		options: ['0', '1'],
		onChange: value => heatmap.applyOptions({ cellGap: Number(value) }),
	},
]);
