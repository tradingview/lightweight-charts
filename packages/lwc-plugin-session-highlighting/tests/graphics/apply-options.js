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

// Options and the highlighter can be changed after attach. The screenshot
// shows the second state: visible again, every bar in one green tint.
function runTestCase(container) {
	const { chart, series } = createCandles(container);
	series.setData(generateData());
	const highlighting = new LwcPlugin.SessionHighlighting(weekends, { visible: false });
	series.attachPrimitive(highlighting);
	chart.timeScale().fitContent();
	return new Promise(resolve => {
		setTimeout(() => {
			highlighting.setHighlighter(() => 'rgba(8, 153, 129, 0.15)');
			highlighting.applyOptions({ visible: true });
			setTimeout(resolve, 300);
		}, 200);
	});
}
