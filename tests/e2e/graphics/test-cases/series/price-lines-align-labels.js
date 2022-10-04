function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 1; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			mode: LightweightCharts.PriceScaleMode.Percentage,
			alignLabels: true,
		},
	});

	const series = chart.addLineSeries();
	series.setData(generateData());

	series.createPriceLine({ price: 58 });
	series.createPriceLine({ price: 59 });
	series.createPriceLine({ price: 60 });
	series.createPriceLine({ price: 61 });
	series.createPriceLine({ price: 62 });
}
