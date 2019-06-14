function generateData(valueOffset, daysStep) {
	var res = [];
	var endDate = new Date(Date.UTC(2020, 0, 1, 0, 0, 0, 0));
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; time.getTime() < endDate.getTime(); ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + daysStep);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var firstSeries = chart.addLineSeries();
	var secondSeries = chart.addLineSeries();

	firstSeries.setData(generateData(0, 3));
	secondSeries.setData(generateData(20, 5));

	chart.timeScale().setVisibleRange({ from: 1570233600, to: 1577750400 });
}
