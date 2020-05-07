function generateData(amplitude) {
	var res = [];
	amplitude = amplitude || 30;
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 + amplitude * Math.sin(Math.PI * i / 50),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		priceScale: {
			scaleMargins: {
				bottom: 0,
				top: 0,
			},
		},
	});

	var mainSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#0000ff',
	});

	mainSeries.setData(generateData(20));

	var secondSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#ff0000',
		autoscaleInfoProvider: function() {
			return null;
		},
	});

	secondSeries.setData(generateData());
}
