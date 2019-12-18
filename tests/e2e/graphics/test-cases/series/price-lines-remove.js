function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 60; ++i) {
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

	var series = chart.addLineSeries();
	series.setData(generateData());

	var line1 = series.createPriceLine({ price: 10 });
	var line2 = series.createPriceLine({ price: 20 });

	return new Promise((resolve) => {
		setTimeout(() => {
			series.removePriceLine(line2);
			series.removePriceLine(line1);
			resolve();
		}, 1000);
	});
}
