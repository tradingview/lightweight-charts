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

// A series primitive is drawn in the pane of its series only: the shading
// sits in the second pane and the first pane stays plain.
function runTestCase(container) {
	const { chart, series } = createCandles(container);
	const data = generateData();
	series.setData(data);
	const lower = chart.addSeries(LightweightCharts.LineSeries, { color: '#F23645' }, 1);
	lower.setData(data.map(bar => ({ time: bar.time, value: bar.close - 50 })));
	lower.attachPrimitive(new LwcPlugin.SessionHighlighting(weekends));
	chart.timeScale().fitContent();
	return new Promise(resolve => setTimeout(resolve, 300));
}
