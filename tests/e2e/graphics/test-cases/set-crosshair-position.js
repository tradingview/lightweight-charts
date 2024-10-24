function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0));

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
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const series = chart.addLineSeries();
	series.setData(generateData());
	chart.timeScale().fitContent();

	chart.setCrosshairPosition(Date.UTC(2023, 2, 1, 0, 0, 0, 0) / 1000, 10, series);
}
