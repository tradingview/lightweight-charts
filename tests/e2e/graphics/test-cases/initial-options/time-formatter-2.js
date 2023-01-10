function dataItem(time, value) {
	return { value, time };
}

function getData() {
	return [
		dataItem('2020-02-01', 1),
		dataItem('2020-02-02', 2),
		dataItem('2020-02-03', 3),
		dataItem('2020-02-04', 4),
		dataItem('2020-02-05', 5),
		dataItem('2020-02-06', 6),
		dataItem('2020-02-07', 5),
		dataItem('2020-02-08', 4),
		dataItem('2020-02-09', 3),
		dataItem('2020-02-10', 2),
		dataItem('2020-02-11', 1),
	];
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		localization: {
			timeFormatter: time => time, // return time as is
		},
	});

	const firstSeries = chart.addLineSeries();
	firstSeries.setData(getData());
	chart.timeScale().fitContent();
}
