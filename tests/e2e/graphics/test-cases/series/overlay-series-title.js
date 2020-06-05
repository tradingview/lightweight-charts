function generateData(func) {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: func(i),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addLineSeries({
		color: '#ff0000',
		title: 'Main series',
	});

	var overlaySeries = chart.addLineSeries({
		color: '#00ff00',
		title: 'Overlay series',
		priceScaleId: 'overlay-scale-id',
	});

	mainSeries.setData(generateData(Math.sin));
	overlaySeries.setData(generateData(Math.cos));
}
