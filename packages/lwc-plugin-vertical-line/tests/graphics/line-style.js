function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// One line per `LineStyle`, plus a `lineVisible: false` line which contributes
// its time-axis label only.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	series.setData(data);

	const colors = ['#089981', '#2962FF', '#F23645', '#9C27B0', '#FF9800'];
	for (let style = 0; style <= 4; style++) {
		series.attachPrimitive(new LwcPlugin.VerticalLine(data[10 + style * 15].time, {
			lineStyle: style,
			color: colors[style],
			width: 2,
		}));
	}

	series.attachPrimitive(new LwcPlugin.VerticalLine(data[90].time, {
		lineVisible: false,
		showLabel: true,
		labelText: 'Label only',
		labelBackgroundColor: '#787B86',
	}));

	chart.timeScale().fitContent();
}
