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
	var chart = LightweightCharts.createChart(container);

	var areaSeries = chart.addAreaSeries({
		priceFormat: {
			type: 'custom',
			minMove: 0.01,
			formatter: function(price) {
				return '\u0024' + price.toFixed(2);
			},
		},
	});

	areaSeries.setData(generateData());

	var lineSeries = chart.addLineSeries();

	lineSeries.setData(generateData());
}
