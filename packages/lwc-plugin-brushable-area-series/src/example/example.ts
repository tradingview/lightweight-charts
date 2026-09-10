import {
	LineSeries,
	LineStyle,
	Time,
	WhitespaceData,
	createChart,
} from 'lightweight-charts';
import { generateLineData } from './sample-data';
import { BrushableAreaSeries } from '../brushable-area-series';
import { BrushableAreaInteraction } from '../interaction';
import { BrushableAreaData } from '../data';
import { BrushableAreaStyle } from '../options';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	grid: {
		vertLines: { visible: false },
		horzLines: { visible: false },
	},
	timeScale: { borderVisible: false },
	rightPriceScale: { borderVisible: false },
	// Brushing and panning are the same gesture, so the chart gives it up.
	handleScale: false,
	handleScroll: false,
}));

const brushStyles: Record<string, Partial<BrushableAreaStyle>> = {
	green: {
		lineColor: 'rgb(4,153,129)',
		topColor: 'rgba(4,153,129, 0.4)',
		bottomColor: 'rgba(4,153,129, 0)',
		lineWidth: 3,
	},
	orange: {
		lineColor: 'rgb(245,124,0)',
		topColor: 'rgba(245,124,0, 0.4)',
		bottomColor: 'rgba(245,124,0, 0)',
		lineWidth: 3,
	},
	red: {
		lineColor: 'rgb(242,54,69)',
		topColor: 'rgba(242,54,69, 0.4)',
		bottomColor: 'rgba(242,54,69, 0)',
		lineWidth: 3,
	},
};

const allData = generateLineData(200);

// A plain line series covering the whole range, starting 40 bars BEFORE the
// brushable one: brush ranges are logical indices of the time scale, so they
// have to keep working when the brushable series is not the first series.
const referenceSeries = chart.addSeries(LineSeries, {
	color: 'rgba(120,123,134, 0.5)',
	lineWidth: 1,
	priceLineVisible: false,
	lastValueVisible: false,
});
referenceSeries.setData(allData);

const brushableSeries = chart.addCustomSeries(new BrushableAreaSeries(), {
	priceLineVisible: false,
	lineColor: 'rgb(40,98,255)',
	topColor: 'rgba(40,98,255, 0.4)',
	bottomColor: 'rgba(40,98,255, 0)',
});

// Starts 40 bars later, and points 110..124 carry a time only: the line breaks
// at the whitespace gap instead of being bridged.
const brushableData: (BrushableAreaData | WhitespaceData)[] = allData
	.slice(40)
	.map((point: { time: Time; value: number }, index: number) =>
		index >= 70 && index < 85 ? { time: point.time } : point
	);
brushableSeries.setData(brushableData);

const brush = new BrushableAreaInteraction({ style: brushStyles.green });
brushableSeries.attachPrimitive(brush);

const rangeLabel = document.getElementById('range') as HTMLElement;
brush.activeRange().subscribe(range => {
	rangeLabel.textContent =
		range === null
			? 'no selection'
			: `logical ${range.from}…${range.to} (${String(range.fromTime)} → ${String(
					range.toTime
				)})`;
});

const brushStyleSelect = document.getElementById(
	'brush-style'
) as HTMLSelectElement;
const lineStyleSelect = document.getElementById(
	'line-style'
) as HTMLSelectElement;
const basePriceInput = document.getElementById('base-price') as HTMLInputElement;
const basePriceLabel = document.getElementById('base-price-value') as HTMLElement;

brushStyleSelect.addEventListener('change', () => {
	brush.applyOptions({ style: brushStyles[brushStyleSelect.value] });
});

lineStyleSelect.addEventListener('change', () => {
	brushableSeries.applyOptions({
		lineStyle: Number(lineStyleSelect.value) as LineStyle,
	});
});

const maxValue = Math.max(...allData.map((point: { value: number }) => point.value));
basePriceInput.max = String(Math.round(maxValue));
basePriceInput.addEventListener('input', () => {
	const basePrice = Number(basePriceInput.value);
	basePriceLabel.textContent = String(basePrice);
	brushableSeries.applyOptions({ basePrice });
});

chart.timeScale().fitContent();
