function generateData(colors) {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 30; ++i) {
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

	var mainSeries = chart.addHistogramSeries();

	mainSeries.setData(generateData([
		'red',
		'blue',
	]));

	return new Promise((resolve) => {
		setTimeout(() => {
			mainSeries.setData(generateData([
				'black',
				'green',
			]));

			resolve();
		}, 500);
	});
}
