function generateData(valueOffset, daysStep) {
	const res = [];
	const endDate = new Date(Date.UTC(2020, 0, 1, 0, 0, 0, 0));
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; time.getTime() < endDate.getTime(); ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + daysStep);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const firstSeries = chart.addLineSeries();
	const secondSeries = chart.addLineSeries();

	firstSeries.setData(generateData(0, 3));
	secondSeries.setData(generateData(20, 5));

	chart.timeScale().setVisibleRange({ from: 1570233600, to: 1577750400 });
}
