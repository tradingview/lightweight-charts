function generateData(step) {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 30; ++i) {
		if (i % step === 0) {
			res.push({
				time: time.getTime() / 1000,
				value: i,
			});
		}

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 100,
		},
	});

	var lineSeries = chart.addLineSeries();
	lineSeries.setData(generateData(1));

	var histogramSeries = chart.addHistogramSeries();
	histogramSeries.setData(generateData(3));
}
