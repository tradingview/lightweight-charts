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
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries();

	const data = generateData();
	mainSeries.setData(data);

	mainSeries.setMarkers([
		{ time: data[0].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 4].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 3].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 2].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 1].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
	]);

	chart.timeScale().scrollToPosition(-4);
}
