function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + ((i % 3) + 1) * 0.3333,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	res.push({
		time: time.getTime() / 1000,
		value: 500,
	});

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const series = chart.addLineSeries({
		priceFormat: {
			type: 'custom',
			minMove: 0.00000001,
			formatter: price => {
				if (price % 1 === 0) {
					return price + 'USD';
				}

				return price.toFixed(3) + 'USD';
			},
		},
	});

	series.setData(generateData());

	chart.timeScale().fitContent();
}
