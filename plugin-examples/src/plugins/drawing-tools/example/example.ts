import { LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { DrawingTools } from '../drawing-tools';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries);
const data = generateLineData();
lineSeries.setData(data);

new DrawingTools(
	chart,
	lineSeries,
	document.querySelector<HTMLDivElement>('#toolbar')!,
	{
		showLabels: false,
	}
);
