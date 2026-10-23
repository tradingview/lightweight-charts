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

function createCandles(container, options) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		...options,
	}));
	const series = chart.addSeries(LightweightCharts.CandlestickSeries);
	return { chart, series };
}

// An empty string from the highlighter means no fill: every other bar is
// left untouched, so the stripes show the exact column of each bar.
function runTestCase(container) {
	const { chart, series } = createCandles(container);
	series.setData(generateData(40));
	series.attachPrimitive(new LwcPlugin.SessionHighlighting(time => {
		const day = Math.round(time / 86400);
		return day % 2 === 0 ? 'rgba(41, 98, 255, 0.2)' : '';
	}));
	chart.timeScale().fitContent();
	return new Promise(resolve => setTimeout(resolve, 300));
}
