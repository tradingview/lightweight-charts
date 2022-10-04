function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const lineSeries1 = chart.addLineSeries();
	const lineSeries2 = chart.addLineSeries();

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
