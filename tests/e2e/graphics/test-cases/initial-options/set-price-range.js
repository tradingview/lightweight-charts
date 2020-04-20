function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 + 30 * Math.sin(i * Math.PI / 50),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		priceScale: {
			priceRange: {
				minValue: 0,
				maxValue: 100,
			},
			scaleMargins: {
				bottom: 0,
				top: 0,
			},
		},
	});

	var firstSeries = chart.addLineSeries({
		title: 'AAPL',
	});

	firstSeries.setData(generateData());
}
