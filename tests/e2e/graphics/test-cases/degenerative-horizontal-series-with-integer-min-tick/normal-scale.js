function generateData() {
	var res = [];

	var endDate = new Date(Date.UTC(2019, 0, 1, 0, 0, 0, 0));
	var time = new Date(new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)));
	for (var i = 0; time.getTime() < endDate.getTime(); ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 10,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		priceScale: {
			mode: LightweightCharts.PriceScaleMode.Normal,
		},
	});

	var firstSeries = chart.addLineSeries({
		priceFormat: {
			minMove: 10,
		},
	});

	firstSeries.setData(generateData());
}
