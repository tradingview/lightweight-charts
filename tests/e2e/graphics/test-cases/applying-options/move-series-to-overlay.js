function generateData(offset) {
	offset = offset || 0;
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + offset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var firstSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#ff0000',
	});

	firstSeries.setData(generateData());

	var secondsSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#0000ff',
	});

	secondsSeries.setData(generateData(100));

	firstSeries.applyOptions({
		priceScaleId: 'overlay',
	});
}
