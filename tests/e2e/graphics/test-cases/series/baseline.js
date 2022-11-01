function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 50; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i * (-1),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: -50 + i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 - i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: -50 + i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addBaselineSeries({
		lineWidth: 1,
		baseValue: {
			type: 'price',
			price: 0,
		},
	});

	chart.timeScale().fitContent();

	mainSeries.setData(generateData());
}
