import { Logical, WhitespaceData, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { BrushableAreaSeries } from '../brushable-area-series';
import { BrushableAreaData } from '../data';
import { BrushableAreaStyle } from '../options';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
	timeScale: {
		borderVisible: false,
	},
	rightPriceScale: {
		borderVisible: false,
	},
	handleScale: false,
	handleScroll: false,
}));

const greenStyle: Partial<BrushableAreaStyle> = {
	lineColor: 'rgb(4,153,129)',
	topColor: 'rgba(4,153,129, 0.4)',
	bottomColor: 'rgba(4,153,129, 0)',
	lineWidth: 3,
};

const fadeStyle: Partial<BrushableAreaStyle> = {
	lineColor: 'rgb(40,98,255, 0.2)',
	topColor: 'rgba(40,98,255, 0.05)',
	bottomColor: 'rgba(40,98,255, 0)',
};

const baseStyle: Partial<BrushableAreaStyle> = {
	lineColor: 'rgb(40,98,255)',
	topColor: 'rgba(40,98,255, 0.4)',
	bottomColor: 'rgba(40,98,255, 0)',
};

const customSeriesView = new BrushableAreaSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	...baseStyle,
	priceLineVisible: false,
});

const data: (BrushableAreaData | WhitespaceData)[] = generateLineData();
myCustomSeries.setData(data);

chart.timeScale().fitContent();

interface MouseState {
	drawing: boolean;
	startLogical: number | null;
	activeRange: boolean;
}

const mouseState: MouseState = {
	drawing: false,
	startLogical: null,
	activeRange: false,
};

const chartElement = chart.chartElement();

function determinePaneXLogical(mouseX: number): Logical | null {
	const chartBox = chartElement.getBoundingClientRect();
	const x = mouseX - chartBox.left - chart.priceScale('left').width();
	if (x < 0 || x > chart.timeScale().width()) return null;
	return chart.timeScale().coordinateToLogical(x);
}

chartElement.addEventListener('mousedown', (event: MouseEvent) => {
	myCustomSeries.applyOptions({
		brushRanges: [],
		...baseStyle,
	});
	mouseState.startLogical = determinePaneXLogical(event.clientX);
	mouseState.drawing = mouseState.startLogical !== null;
	mouseState.activeRange = false;
});
chartElement.addEventListener('mousemove', (event: MouseEvent) => {
	if (!mouseState.drawing) return;
	const endLogical = determinePaneXLogical(event.clientX);
	if (endLogical !== null && mouseState.startLogical !== null) {
		const first = Math.min(mouseState.startLogical, endLogical);
		const end = Math.max(mouseState.startLogical, endLogical);
		if (first === end) return;
		mouseState.activeRange = true;
		myCustomSeries.applyOptions({
			brushRanges: [
				{
					range: {
						from: first,
						to: end,
					},
					style: greenStyle,
				},
			],
			...fadeStyle,
		});
	}
});

chartElement.addEventListener('mouseup', () => {
	mouseState.drawing = false;
	if (!mouseState.activeRange) {
		myCustomSeries.applyOptions({
			brushRanges: [],
			...baseStyle,
		});
	}
});

chartElement.addEventListener('mouseleave', () => {
	mouseState.drawing = false;
});
