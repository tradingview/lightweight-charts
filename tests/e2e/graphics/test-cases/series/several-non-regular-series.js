// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var lineSeries1 = chart.addLineSeries();
	var lineSeries2 = chart.addLineSeries();

	lineSeries1.setData([
		{ time: '2020-01-02', value: 2 },
		{ time: '2020-01-04', value: 4 },
		{ time: '2020-01-06', value: 6 },
	]);

	lineSeries2.setData([
		{ time: '2020-01-01', value: 11 },
		{ time: '2020-01-03', value: 13 },
		{ time: '2020-01-05', value: 15 },
		{ time: '2020-01-07', value: 17 },
	]);

	chart.timeScale().scrollToPosition(-5);
}
