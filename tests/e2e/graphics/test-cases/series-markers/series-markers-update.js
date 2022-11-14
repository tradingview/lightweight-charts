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

	const markers = [
		{ time: data[data.length - 40].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 20].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 10].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
	];

	mainSeries.setMarkers(markers);

	markers.push({ time: data[data.length - 1].time, position: 'belowBar', color: 'red', shape: 'arrowUp' });

	mainSeries.setMarkers(markers);
}
