function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addLineSeries();

	var data = generateData();
	mainSeries.setData(data);

	var markers = [
		{ time: data[data.length - 10].time, position: 'inBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 20].time, position: 'inBar', color: 'red', shape: 'arrowDown' },
		{ time: data[data.length - 30].time, position: 'inBar', color: 'red', shape: 'circle' },
		{ time: data[data.length - 40].time, position: 'inBar', color: 'red', shape: 'square' },
	];

	mainSeries.setMarkers(markers);
	chart.applyOptions({
		timeScale: {
			barSpacing: 0.01, // will be corrected to min available bar spacing
		},
	});
}
