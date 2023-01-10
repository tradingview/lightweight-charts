function generateData(step, startDay) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, startDay, 0, 0, 0, 0));
	for (let i = 0; i < 10; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 + Math.sin(Math.PI * i / 50),
		});

		time.setUTCDate(time.getUTCDate() + step);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries({
		color: '#0000ff',
	});

	mainSeries.setData(generateData(1, 4));

	const secondSeries = chart.addLineSeries({
		color: '#ff0000',
	});

	secondSeries.setData(generateData(3, 1));

	chart.removeSeries(mainSeries);
}
