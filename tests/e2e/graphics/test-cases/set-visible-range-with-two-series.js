// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	const line1 = chart.addLineSeries();
	line1.setData([
		{ time: '2017-04-11', value: 80.01 },
		{ time: '2017-04-12', value: 96.63 },
		{ time: '2017-04-13', value: 76.64 },
		{ time: '2017-04-14', value: 81.89 },
		{ time: '2017-04-15', value: 74.43 },
		{ time: '2017-04-16', value: 80.01 },
		{ time: '2017-04-17', value: 96.63 },
		{ time: '2017-04-18', value: 76.64 },
		{ time: '2017-04-19', value: 81.89 },
		{ time: '2017-04-20', value: 81.89 },
		{ time: '2017-04-21', value: 81.89 },
		{ time: '2017-04-22', value: 81.89 },
		{ time: '2017-04-23', value: 81.89 },
	]);

	const line2 = chart.addLineSeries();
	line2.setData([
		{ time: '2018-04-11', value: 80.01 },
		{ time: '2018-04-12', value: 96.63 },
		{ time: '2018-04-13', value: 76.64 },
		{ time: '2018-04-14', value: 81.89 },
		{ time: '2018-04-15', value: 74.43 },
		{ time: '2018-04-16', value: 80.01 },
		{ time: '2018-04-17', value: 96.63 },
		{ time: '2018-04-18', value: 76.64 },
		{ time: '2018-04-19', value: 81.89 },
		{ time: '2018-04-20', value: 81.89 },
		{ time: '2018-04-21', value: 81.89 },
		{ time: '2018-04-22', value: 81.89 },
		{ time: '2018-04-23', value: 81.89 },
	]);

	chart.timeScale().setVisibleRange({ from: '2018-04-11', to: '2018-04-23' });
}
