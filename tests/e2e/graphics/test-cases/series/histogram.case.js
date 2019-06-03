function generateData() {
	var colors = [
		'#013370',
		'#3a9656',
		undefined, // default color should be used
	];

	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
			color: colors[i % colors.length],
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addHistogramSeries({
		lineWidth: 1,
		color: '#ff0000',
	});

	mainSeries.setData(generateData());
}
