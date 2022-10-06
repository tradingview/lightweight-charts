function generateData(valueOffset) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const firstSeries = chart.addLineSeries({
		color: 'blue',
	});
	const secondSeries = chart.addLineSeries({
		priceScaleId: 'first-overlay',
		color: 'green',
	});

	chart.priceScale('first-overlay').applyOptions({
		scaleMargins: {
			top: 0.5,
			bottom: 0,
		},
	});

	const thirdSeries = chart.addLineSeries({
		priceScaleId: '',
	});

	thirdSeries.applyOptions({
		color: 'red',
	});

	chart.priceScale('').applyOptions({
		scaleMargins: {
			top: 0,
			bottom: 0.5,
		},
	});

	firstSeries.setData(generateData(0));
	secondSeries.setData(generateData(10));
	thirdSeries.setData(generateData(20));
}
