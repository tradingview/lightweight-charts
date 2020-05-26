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

	chart.timeScale().fitContent();

	var line = series.createPriceLine({
		price: 10,
		color: 'red',
		lineWidth: 1,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	});

	line.applyOptions({
		price: 20,
		color: '#00FF00',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
		axisLabelVisible: false,
	});
}
