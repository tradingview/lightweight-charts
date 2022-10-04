function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
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

	const lineSeries = chart.addLineSeries({
		priceFormat: {
			type: 'price',
			precision: 4,
			minMove: 0.005,
		},
	});
	lineSeries.setData(generateData());
	console.assert(lineSeries.priceFormatter().format(12.1) === '12.1000', 'Wrong format');

	lineSeries.applyOptions({
		priceFormat: {
			type: 'volume',
			precision: 5,
			minMove: 0.05,
		},
	});
	console.assert(lineSeries.priceFormatter().format(1000) === '1K', 'Wrong format');

	lineSeries.applyOptions({
		priceFormat: {
			type: 'percent',
			precision: 3,
			minMove: 0.05,
		},
	});
	console.assert(lineSeries.priceFormatter().format(12.1) === '12.0%', 'Wrong format');

	lineSeries.applyOptions({
		priceFormat: {
			type: 'custom',
			minMove: 0.02,
			formatter: price => 'price=' + price.toFixed(2),
		},
	});
	console.assert(lineSeries.priceFormatter().format(12.1) === 'price=12.10', 'Wrong format');
}
