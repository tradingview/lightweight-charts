function generateData(mul = 1) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i * mul,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const lineSeries = chart.addLineSeries({ visible: false });
	lineSeries.setData(generateData());

	const alwaysVisibleSeries = chart.addLineSeries();
	alwaysVisibleSeries.setData(generateData(1.5));
}
