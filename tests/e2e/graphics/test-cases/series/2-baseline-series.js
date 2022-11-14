function generateData(valueOffset) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 50; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i * (-1) + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: -50 + i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 - i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: -50 + i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const firstSeries = chart.addBaselineSeries({
		baseValue: {
			type: 'price',
			price: 0,
		},
	});

	firstSeries.setData(generateData(0));

	const secondSeries = chart.addBaselineSeries({
		baseValue: {
			type: 'price',
			price: 100,
		},
	});

	secondSeries.setData(generateData(100));

	chart.timeScale().fitContent();
}
