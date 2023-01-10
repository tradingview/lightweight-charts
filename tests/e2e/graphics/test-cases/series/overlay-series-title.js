function generateData(func) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: func(i),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries({
		color: '#ff0000',
		title: 'Main series',
	});

	const overlaySeries = chart.addLineSeries({
		color: '#00ff00',
		title: 'Overlay series',
		priceScaleId: 'overlay-scale-id',
	});

	mainSeries.setData(generateData(Math.sin));
	overlaySeries.setData(generateData(Math.cos));
}
