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
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	// see issue#55
	const mainSeries = chart.addSeries(LightweightCharts.LineSeries, {
		priceFormat: {
			minMove: 0.00001,
			precision: 5,
		},
	});

	mainSeries.setData(generateData());
}
