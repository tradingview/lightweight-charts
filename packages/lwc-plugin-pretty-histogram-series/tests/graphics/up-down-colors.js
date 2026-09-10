function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 20 + Math.sin(i / 7) * 25,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Columns are coloured by their sign relative to `base`, which is 20 here, so
// the two-tone split runs through the middle of the data rather than at zero.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createPrettyHistogramSeries(chart, {
		base: 20,
		upColor: '#089981',
		downColor: '#F23645',
		widthPercent: 70,
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
