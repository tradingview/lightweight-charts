import { LineSeries, createChart } from 'lightweight-charts';
import { HeatmapCellShader, HeatmapData, createColorScale, createHeatmapSeries, defaultOptions } from '../heatmap-series';
import { orderBookData, priceData, profileData, turboColor } from './sample-data';

const shaders: Record<string, HeatmapCellShader> = {
	// Spread over the amounts in view, in 32 steps. The turbo map starts near
	// black, so the scale starts a tenth of the way in, at a deep blue.
	turbo: createColorScale({ stops: Array.from({ length: 9 }, (_, i) => turboColor(0.1 + (i / 8) * 0.9)) }),
	green: defaultOptions.cellShader,
	// A shader of its own, reading the range of the amounts in view.
	purple: (amount, range) => {
		const t = range.max > range.min ? (amount - range.min) / (range.max - range.min) : 1;
		return `rgba(${Math.round(155 - t * 100)}, 0, ${Math.round(155 + t * 100)}, ${Math.round(5 + t * 90) / 100})`;
	},
};

const chart = createChart('chart', {
	autoSize: true,
	timeScale: { barSpacing: 10 },
	// Keep the price line on top while the pointer hovers the heatmap.
	hoveredSeriesOnTop: false,
});

const heatmap = createHeatmapSeries(chart, { cellShader: shaders.turbo, cellGap: 0 });
const line = chart.addSeries(LineSeries, { color: '#FFFFFF', lineWidth: 2, priceLineVisible: false });

function showData(kind: string): void {
	if (kind === 'book') {
		const { mid, book } = orderBookData(240);
		chart.applyOptions({ timeScale: { timeVisible: true } });
		heatmap.setData(book);
		line.setData(mid);
	} else {
		const prices = priceData(150);
		chart.applyOptions({ timeScale: { timeVisible: false } });
		// A whitespace gap, and one column with a cell whose amount is not a number.
		heatmap.setData(
			profileData(prices).map((point, index) => {
				if (index >= 60 && index < 64) {
					return { time: point.time };
				}
				return index === 80 ? { ...point, cells: point.cells.map((cell, i) => (i === 5 && cell !== null ? { ...cell, amount: NaN } : cell)) } : point;
			})
		);
		line.setData(prices);
	}
	chart.timeScale().fitContent();
}

const dataKind = document.getElementById('data') as HTMLSelectElement;
const shader = document.getElementById('shader') as HTMLSelectElement;
const gap = document.getElementById('gap') as HTMLSelectElement;
const border = document.getElementById('border') as HTMLSelectElement;
const hovered = document.getElementById('hovered') as HTMLSpanElement;

showData(dataKind.value);
dataKind.addEventListener('change', () => showData(dataKind.value));
shader.addEventListener('change', () => heatmap.applyOptions({ cellShader: shaders[shader.value] }));
gap.addEventListener('change', () => heatmap.applyOptions({ cellGap: Number(gap.value) }));
border.addEventListener('change', () => {
	const [width, color] = border.value.split(' ');
	heatmap.applyOptions({ cellBorderWidth: Number(width), cellBorderColor: color ?? defaultOptions.cellBorderColor });
});

// The series reports the cell under the pointer on Lightweight Charts 5.2 and
// later, as 'cell-<index>' into the point's cells.
chart.subscribeCrosshairMove(param => {
	const info = param.hoveredInfo;
	const data = param.seriesData.get(heatmap) as Partial<HeatmapData> | undefined;
	if (info === undefined || info.series !== heatmap || typeof info.objectId !== 'string' || data?.cells === undefined) {
		hovered.textContent = '';
		return;
	}
	const cell = data.cells[Number(info.objectId.slice('cell-'.length))];
	hovered.textContent = cell === undefined || cell === null ? '' : `${cell.low}–${cell.high}: ${cell.amount}`;
});
