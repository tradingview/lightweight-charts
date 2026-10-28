function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// A series primitive is drawn in the pane of its series only: the text sits
// in the second pane, and the first pane stays empty.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateData();
	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	mainSeries.setData(data);

	const secondPaneSeries = chart.addSeries(
		LightweightCharts.LineSeries,
		{ color: '#F23645' },
		1
	);
	secondPaneSeries.setData(
		data.map(point => ({ time: point.time, value: 100 - point.value }))
	);
	chart.timeScale().fitContent();

	secondPaneSeries.attachPrimitive(new LwcPlugin.AnchoredText({
		text: 'Second pane',
		horzAlign: 'right',
		vertAlign: 'bottom',
	}));

	return new Promise(resolve => setTimeout(resolve, 300));
}
