import { createChart, LineSeries } from '@bishopbot/lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { BandsIndicator } from '../bands-indicator';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries);
const data = generateLineData();
lineSeries.setData(data);

const bandIndicator = new BandsIndicator();
lineSeries.attachPrimitive(bandIndicator);
