function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		priceScale: {
			autoScale: false,
		},
	});

	var mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());

	// overlay price scale shouldn't inherit autoScale option
	var histogramSeries = chart.addHistogramSeries({
		overlay: true,
		color: '#ff0000',
	});

	histogramSeries.setData(generateData());
}
