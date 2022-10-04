function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const areaSeries = chart.addAreaSeries({
		priceFormat: {
			type: 'custom',
			minMove: 0.01,
			formatter: price => '\u0024' + price.toFixed(2),
		},
	});

	areaSeries.setData(generateData());

	const lineSeries = chart.addLineSeries();

	lineSeries.setData(generateData());
}
