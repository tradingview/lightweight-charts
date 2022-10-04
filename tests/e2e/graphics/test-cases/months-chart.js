function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 12; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCMonth(time.getUTCMonth() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const firstSeries = chart.addLineSeries();
	firstSeries.setData(generateData());
	chart.timeScale().fitContent();
}
