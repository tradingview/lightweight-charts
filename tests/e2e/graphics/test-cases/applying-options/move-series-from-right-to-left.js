function generateData(offset) {
	offset = offset || 0;
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + offset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
		},
		rightPriceScale: {
			visible: true,
		},
	});

	const firstSeries = chart.addLineSeries({
		priceScaleId: 'right',
	});

	firstSeries.setData(generateData());

	firstSeries.applyOptions({
		priceScaleId: 'left',
	});
}
