import {
	LastPriceAnimationMode,
	LineData,
	Time,
	createChart,
} from 'lightweight-charts';
import { ExpiringPriceAlerts } from '../expiring-price-alerts';
import { sampleAlertLineData } from '../sample-data';

const chart = createChart('chart', {
	autoSize: true,
	timeScale: {
		secondsVisible: true,
		timeVisible: true,
	},
});

const lineSeries = chart.addLineSeries({
	lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
});
const data = sampleAlertLineData(); // 622 items
const [initialData, realtimeUpdates] = [data.slice(0, 400), data.slice(400)];
lineSeries.setData(initialData);

const priceAlerts = new ExpiringPriceAlerts(lineSeries, { interval: 60 });

const rightMarginPosition = 20;
chart.timeScale().scrollToPosition(rightMarginPosition, false);

// The rest simulates updates and the user adding price alerts.

const simulateUserPriceAlerts = (time: Time) => {
	if (time === realtimeUpdates[0].time) {
		priceAlerts.addExpiringAlert(
			19.5,
			realtimeUpdates[0].time as number,
			realtimeUpdates[25].time as number,
			{
				crossingDirection: 'down',
				title: '$19.50',
			}
		);
	}
	if (time === realtimeUpdates[30].time) {
		priceAlerts.addExpiringAlert(
			19.75,
			realtimeUpdates[30].time as number,
			realtimeUpdates[45].time as number,
			{
				crossingDirection: 'up',
				title: '$19.75',
			}
		);
	}
	if (time === realtimeUpdates[45].time) {
		priceAlerts.addExpiringAlert(
			19.0,
			realtimeUpdates[45].time as number,
			realtimeUpdates[65].time as number,
			{
				crossingDirection: 'down',
				title: '$19.00',
			}
		);
	}

	if (time === realtimeUpdates[55].time) {
		priceAlerts.addExpiringAlert(
			20.0,
			realtimeUpdates[55].time as number,
			realtimeUpdates[65].time as number,
			{
				crossingDirection: 'up',
				title: '$20.00',
			}
		);
	}

	if (time === realtimeUpdates[75].time) {
		priceAlerts.addExpiringAlert(
			21.25,
			realtimeUpdates[80].time as number,
			realtimeUpdates[220].time as number,
			{
				crossingDirection: 'up',
				title: 'wishful',
			}
		);
	}
}

simulateUserPriceAlerts(realtimeUpdates[0].time);

// simulate real-time data
function* getNextRealtimeUpdate(realtimeData: LineData[]) {
	for (const dataPoint of realtimeData) {
		yield dataPoint;
	}
	return null;
}
const streamingDataProvider = getNextRealtimeUpdate(realtimeUpdates);

// Since we are using whitespace to draw into the future
// updates which are within that whitespace time won't
// trigger an automatic scrolling of the chart
// We are thus doing this manually we we update the series,
// but should check if the user has scrolled and then disable that.
let userScrolledChart = false;
chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
	const pos = chart.timeScale().scrollPosition();
	if (pos !== 0 && Math.abs(pos - rightMarginPosition) > 1) {
		userScrolledChart = true;
	}
});

const intervalID = window.setInterval(() => {
	const update = streamingDataProvider.next();
	if (update.done) {
		window.clearInterval(intervalID);
		return;
	}
	lineSeries.update(update.value);
	if (!userScrolledChart) {
		chart.timeScale().scrollToPosition(rightMarginPosition, false);
	}
	simulateUserPriceAlerts(update.value.time);
}, 200);

