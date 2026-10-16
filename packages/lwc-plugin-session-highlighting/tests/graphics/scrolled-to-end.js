// Daily candles from 2018-01-01, weekends included, so the highlighter sees
// every day of the week.
function generateData(count = 100, start = Date.UTC(2018, 0, 1, 0, 0, 0, 0)) {
	const res = [];
	const time = new Date(start);
	let close = 50;
	for (let i = 0; i < count; ++i) {
		const open = close;
		close = 50 + Math.sin(i / 10) * 20;
		res.push({
			time: time.getTime() / 1000,
			open,
			high: Math.max(open, close) + 2,
			low: Math.min(open, close) - 2,
			close,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function weekends(time) {
	const day = new Date(time * 1000).getUTCDay();
	return day === 0 || day === 6 ? "rgba(255, 152, 1, 0.25)" : "rgba(41, 98, 255, 0.08)";
}

function createCandles(container, options) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		...options,
	}));
	const series = chart.addSeries(LightweightCharts.CandlestickSeries);
	return { chart, series };
}

// Scrolled so that only the tail of the data is on screen, with empty space
// to the right: the visible slice ends at the last bar and the bars partly
// off the left edge are still shaded.
function runTestCase(container) {
	const { chart, series } = createCandles(container, {
		timeScale: { barSpacing: 12, rightOffset: 10 },
	});
	series.setData(generateData(300));
	series.attachPrimitive(new LwcPlugin.SessionHighlighting(weekends));
	chart.timeScale().scrollToRealTime();
	return new Promise(resolve => setTimeout(resolve, 300));
}
