function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i * 1e-18,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		priceFormat: {
			type: 'custom',
			formatter: p => `$${p}`,
			minMove: 1e-18, // should be ignored because base is specified
			base: 1e18,
		},
	});
	lineSeries.setData(generateData());
}
