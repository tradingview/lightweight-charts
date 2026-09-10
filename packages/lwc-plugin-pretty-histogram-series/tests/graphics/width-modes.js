function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 10 + Math.abs(Math.sin(i / 6)) * 20,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The top pane is the plugin in `histogram` width mode, the bottom pane the
// built-in histogram series with the same data: the columns must have the same
// width and sit at the same x positions.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateData();

	const series = chart.addCustomSeries(new LwcPlugin.PrettyHistogramSeries(), {
		color: '#2962FF',
		widthMode: 'histogram',
		radius: 0,
	});
	series.setData(data);

	const builtIn = chart.addSeries(LightweightCharts.HistogramSeries, {
		color: '#F23645',
	}, 1);
	builtIn.setData(data);

	chart.timeScale().fitContent();
}
