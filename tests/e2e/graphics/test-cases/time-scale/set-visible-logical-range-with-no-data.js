function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);
	chart.timeScale().setVisibleLogicalRange({ from: -1001000, to: -1000000 });

	// to force subscribe and emit event
	chart.timeScale().subscribeVisibleTimeRangeChange(() => console.log('range changed'));

	return new Promise(resolve => {
		setTimeout(() => {
			const mainSeries = chart.addLineSeries();
			mainSeries.setData(generateData());
			resolve();
		}, 100);
	});
}
