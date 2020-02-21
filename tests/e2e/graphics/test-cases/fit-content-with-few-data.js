function generateData(valueOffset, count) {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var series = chart.addLineSeries();

	series.setData(generateData(0, 10));

	chart.timeScale().fitContent();
}
