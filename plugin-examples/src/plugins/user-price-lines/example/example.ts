import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { UserPriceLines } from '../user-price-lines';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addLineSeries();
const data = generateLineData();
lineSeries.setData(data);

new UserPriceLines(chart, lineSeries, { color: 'hotpink' });
