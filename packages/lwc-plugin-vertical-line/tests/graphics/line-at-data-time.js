function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	series.setData(data);

	series.attachPrimitive(new LwcPlugin.VertLine(chart, series, data[60].time, {
		showLabel: true,
		labelText: 'Event',
	}));
	series.attachPrimitive(new LwcPlugin.VertLine(chart, series, data[80].time, {
		color: 'red',
		width: 1,
	}));
	chart.timeScale().fitContent();
}
