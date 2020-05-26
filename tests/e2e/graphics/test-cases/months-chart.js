function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 12; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCMonth(time.getUTCMonth() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var firstSeries = chart.addLineSeries();
	firstSeries.setData(generateData());
	chart.timeScale().fitContent();
}
