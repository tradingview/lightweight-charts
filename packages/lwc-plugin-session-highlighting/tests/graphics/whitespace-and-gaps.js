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

// Neither a whitespace item nor a run of missing days is a bar, so neither
// gets a color and the shading simply stops there.
function runTestCase(container) {
	const { chart, series } = createCandles(container);
	const data = generateData(60)
		.filter((bar, i) => i < 20 || i >= 30)
		.map((bar, i) => (i % 7 === 3 ? { time: bar.time } : bar));
	series.setData(data);
	series.attachPrimitive(new LwcPlugin.SessionHighlighting(() => 'rgba(41, 98, 255, 0.15)'));
	chart.timeScale().fitContent();
	return new Promise(resolve => setTimeout(resolve, 300));
}
