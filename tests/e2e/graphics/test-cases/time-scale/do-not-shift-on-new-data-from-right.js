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
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			rightOffset: 10,
			shiftVisibleRangeOnNewBar: false,
		},
	});

	const mainSeries = chart.addLineSeries();

	const data = generateData();

	mainSeries.setData(data.slice(0, -20));

	return new Promise(resolve => {
		setTimeout(() => {
			mainSeries.setData(data);
			resolve();
		}, 100);
	});
}
