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
	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	mainSeries.setData(data);

	const secondPaneSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#F23645',
	}, 1);
	secondPaneSeries.setData(data.map(point => ({ time: point.time, value: 100 - point.value })));

	mainSeries.attachPrimitive(new LwcPlugin.VerticalLine(data[25].time, {
		showLabel: true,
		labelText: 'Pane 0',
		color: 'green',
	}));
	secondPaneSeries.attachPrimitive(new LwcPlugin.VerticalLine(data[75].time, {
		showLabel: true,
		labelText: 'Pane 1',
		color: 'blue',
	}));

	chart.timeScale().fitContent();
}
