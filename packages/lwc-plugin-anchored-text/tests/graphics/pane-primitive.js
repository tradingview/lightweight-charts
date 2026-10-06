function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The pane primitive needs no series: one centred label per pane, attached to
// the panes themselves, as the library's own pane-primitives case does.
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

	chart.panes()[0].attachPrimitive(new LwcPlugin.AnchoredTextPane({
		text: 'Pane 1',
		horzAlign: 'center',
		vertAlign: 'center',
		font: 'italic 54px Arial',
		color: 'red',
	}));
	chart.panes()[1].attachPrimitive(new LwcPlugin.AnchoredTextPane({
		text: 'Pane 2',
		horzAlign: 'center',
		vertAlign: 'center',
		font: 'bold 26px Arial',
		color: 'blue',
	}));

	return new Promise(resolve => setTimeout(resolve, 300));
}
