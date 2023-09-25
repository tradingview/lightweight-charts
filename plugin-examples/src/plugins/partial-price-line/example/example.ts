import { LastPriceAnimationMode, LineData, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { PartialPriceLine } from '../partial-price-line';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addLineSeries({
	lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
});

const data = generateLineData();
const [initialData, realtimeUpdates] = [data.slice(0, -100), data.slice(-100)];
lineSeries.setData(initialData);

lineSeries.attachPrimitive(new PartialPriceLine());

const pos = chart.timeScale().scrollPosition();
chart.timeScale().scrollToPosition(pos + 20, false);

// simulate real-time data
function* getNextRealtimeUpdate(realtimeData: LineData[]) {
	for (const dataPoint of realtimeData) {
		yield dataPoint;
	}
	return null;
}
const streamingDataProvider = getNextRealtimeUpdate(realtimeUpdates);

const intervalID = window.setInterval(() => {
	const update = streamingDataProvider.next();
	if (update.done) {
		window.clearInterval(intervalID);
		return;
	}
	lineSeries.update(update.value);
}, 200);
