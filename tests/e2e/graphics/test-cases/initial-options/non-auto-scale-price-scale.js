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
	const chart = LightweightCharts.createChart(container, {
		priceScale: {
			autoScale: false,
		},
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());

	// overlay price scale shouldn't inherit autoScale option
	const histogramSeries = chart.addHistogramSeries({
		overlay: true,
		color: '#ff0000',
	});

	histogramSeries.setData(generateData());
}
