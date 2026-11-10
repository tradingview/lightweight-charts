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
	// Through purple and red rather than straight from blue to orange, whose
	// midpoint is a muddy gray.
	heat: createColorScale({ stops: ['rgba(41, 98, 255, 0.12)', 'rgba(41, 98, 255, 0.8)', '#9C27B0', '#F23645', '#FF9800'] }),
	blue: createColorScale({ stops: ['rgba(41, 98, 255, 0.1)', 'rgba(41, 98, 255, 1)'], steps: 16 }),
};

// 20 levels either side, a price unit apart, so the levels stay a few pixels
// tall in the small catalog frame.
const { mid, book } = orderBookData(150, 3, 20, 1);
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
