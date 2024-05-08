function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 30; ++i) {
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

	const mainSeries = chart.addHistogramSeries();

	const data = generateData();
	mainSeries.setData(data);

	const markers = [
		{ time: data[data.length - 3].time, position: 'inBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 2].time, position: 'inBar', color: 'red', shape: 'arrowUp' },
	];

	mainSeries.setMarkers(markers);
}
