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
	const chart = window.chart = LightweightCharts.createChart(container);

	const firstSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#ff0000',
	});

	firstSeries.setData(generateData());

	const secondsSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#0000ff',
	});

	secondsSeries.setData(generateData(100));

	firstSeries.applyOptions({
		priceScaleId: 'overlay',
	});
}
