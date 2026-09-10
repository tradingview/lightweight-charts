import { WhitespaceData, createChart } from 'lightweight-charts';
import { multipleBarData } from '../../../sample-data';
import { StackedAreaData, StackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	rightPriceScale: {
		scaleMargins: {
			top: 0.05,
			bottom: 0.05,
		}
	}
}));

const customSeriesView = new StackedAreaSeries();
const myCustomSeries = chart.addCustomSeries(customSeriesView, {
	/* Options */
});

const data: (StackedAreaData | WhitespaceData)[] = multipleBarData(5, 200, 2);
myCustomSeries.setData(data);

chart.timeScale().fitContent();
