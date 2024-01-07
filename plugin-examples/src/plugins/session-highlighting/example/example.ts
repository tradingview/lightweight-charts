import { Time, createChart, isBusinessDay, isUTCTimestamp } from 'lightweight-charts';
import { CandleData, generateAlternativeCandleData } from '../../../sample-data';
import { SessionHighlighting } from '../session-highlighting';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const candleSeries = chart.addCandlestickSeries();
const data = generateAlternativeCandleData(250);
const [initialData, realtimeUpdates] = [data.slice(0, 200), data.slice(200)];
candleSeries.setData(initialData);

function getDate(time: Time): Date {
	if (isUTCTimestamp(time)) {
		return new Date(time * 1000);
	} else if (isBusinessDay(time)) {
		return new Date(time.year, time.month, time.day);
	} else {
		return new Date(time);
	}
}

const sessionHighlighter = (time: Time) => {
	const date = getDate(time);
	const dayOfWeek = date.getDay();
	if (dayOfWeek === 0 || dayOfWeek === 6) {
		// Weekend 🏖️
		return 'rgba(255, 152, 1, 0.08)'
	}
	return 'rgba(41, 98, 255, 0.08)';
};

const sessionHighlighting = new SessionHighlighting(sessionHighlighter);
candleSeries.attachPrimitive(sessionHighlighting);

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
