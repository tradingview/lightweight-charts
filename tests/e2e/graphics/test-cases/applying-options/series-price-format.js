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

	const mainSeries = chart.addLineSeries({
		priceFormat: {
			minMove: 0.000001,
			precision: 6,
		},
	});

	mainSeries.setData(generateData());

	return new Promise(resolve => {
		setTimeout(() => {
			mainSeries.applyOptions({
				priceFormat: {
					minMove: 0.01,
					precision: 2,
				},
			});
			resolve();
		}, 100);
	});
}
