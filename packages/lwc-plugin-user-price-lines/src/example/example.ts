import { LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { UserPriceLines } from '../user-price-lines';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries);
const data = generateLineData();
lineSeries.setData(data);

new UserPriceLines(chart, lineSeries, { color: 'hotpink' });
