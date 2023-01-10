function generateData(step) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 30; ++i) {
		if (i % step === 0) {
			res.push({
				time: time.getTime() / 1000,
				value: i,
			});
		}

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			barSpacing: 100,
		},
	});

	const lineSeries = chart.addLineSeries();
	lineSeries.setData(generateData(1));

	const histogramSeries = chart.addHistogramSeries();
	histogramSeries.setData(generateData(3));
}
