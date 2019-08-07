// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	const line = chart.addLineSeries();
	line.setData([
		{ time: '2017-04-11', value: 80.01 },
		{ time: '2017-04-12', value: 96.63 },
		{ time: '2017-04-13', value: 76.64 },
		{ time: '2017-04-14', value: 81.89 },
		{ time: '2017-04-15', value: 74.43 },
		{ time: '2017-04-19', value: 81.89 },
		{ time: '2017-04-20', value: 81.89 },
		{ time: '2017-04-21', value: 81.89 },
		{ time: '2017-04-22', value: 81.89 },
		{ time: '2017-04-23', value: 81.89 },
	]);

	line.setMarkers([
		{ time: { year: 2017, month: 4, day: 11 }, position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: { year: 2017, month: 4, day: 14 }, position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: { year: 2017, month: 4, day: 15 }, position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: { year: 2017, month: 4, day: 19 }, position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: { year: 2017, month: 4, day: 23 }, position: 'inBar', color: 'orange', shape: 'circle' },
	]);

	chart.timeScale().fitContent();
}
