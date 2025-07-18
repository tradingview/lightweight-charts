import { CandlestickSeries, createChart } from "lightweight-charts";
import { CandleData, generateCandleData } from "../../../sample-data";
import { MinMaxPriceMarkers } from "../primitive";

const chart = ((window as unknown as any).chart = createChart("chart", {
	autoSize: true,
}));

const candleSeries = chart.addSeries(CandlestickSeries);
const data = generateCandleData(10000);
const [initialData, realtimeUpdates] = [data.slice(0, -100), data.slice(-100)];
candleSeries.setData(initialData);

const minMaxPriceMarkers = new MinMaxPriceMarkers();
candleSeries.attachPrimitive(minMaxPriceMarkers);

// simulate real-time data
function* getNextRealtimeUpdate(realtimeData: CandleData[]) {
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
	candleSeries.update(update.value);
}, 200);
