import { Time, createChart, isBusinessDay, isUTCTimestamp, isUTCTimestampNanoseconds, CandlestickSeries } from '@bishopbot/lightweight-charts';
import { generateAlternativeCandleData } from '../../../sample-data';
import { SessionHighlighting } from '../session-highlighting';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const candleSeries = chart.addSeries(CandlestickSeries);
const data = generateAlternativeCandleData();
candleSeries.setData(data);

function getDate(time: Time): Date {
	if (isUTCTimestamp(time)) {
		return new Date(time * 1000);
	} else if (isUTCTimestampNanoseconds(time)) {
		// `Date` holds milliseconds; the sub-millisecond part is dropped.
		return new Date(Number(time / 1_000_000n));
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
