import { WhitespaceData, createChart } from 'lightweight-charts';
import { BrushableAreaSeries } from '../../plugins/brushable-area-series/brushable-area-series';
import { BrushableAreaData } from '../../plugins/brushable-area-series/data';
import { BrushableAreaStyle } from '../../plugins/brushable-area-series/options';
import { DeltaTooltipPrimitive } from '../../plugins/delta-tooltip/delta-tooltip';
import { generateLineData } from '../../sample-data';

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

const redStyle: Partial<BrushableAreaStyle> = {
	lineColor: 'rgb(239,83,80)',
	topColor: 'rgba(239,83,80, 0.4)',
	bottomColor: 'rgba(239,83,80, 0)',
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
const brushAreaSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
	...baseStyle,
	priceLineVisible: false,
});

const data: (BrushableAreaData | WhitespaceData)[] = generateLineData();
brushAreaSeries.setData(data);

const tooltipPrimitive = new DeltaTooltipPrimitive({
	lineColor: 'rgba(0, 0, 0, 0.2)',
});

brushAreaSeries.attachPrimitive(tooltipPrimitive);

chart.timeScale().fitContent();

tooltipPrimitive.activeRange().subscribe(activeRange => {
	if (activeRange === null) {
		brushAreaSeries.applyOptions({
			brushRanges: [],
			...baseStyle,
		});
		return;
	}
	brushAreaSeries.applyOptions({
		brushRanges: [
			{
				range: {
					from: activeRange.from,
					to: activeRange.to,
				},
				style: activeRange.positive ? greenStyle : redStyle,
			},
		],
		...fadeStyle,
	});
});

window.addEventListener('resize', () => {
	requestAnimationFrame(() => {
		chart.timeScale().fitContent();
	});
});
