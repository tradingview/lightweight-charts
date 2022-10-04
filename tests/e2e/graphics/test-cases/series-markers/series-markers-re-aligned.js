function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const line = chart.addLineSeries();
	line.setData([
		{ time: '2017-04-11', value: 80.01 },
		{ time: '2017-04-12', value: 96.63 },
		{ time: '2017-04-13', value: 76.64 },
		{ time: '2017-04-14', value: 81.89 },
		{ time: '2017-04-15', value: 74.43 },
		{ time: '2017-04-19', value: 91.89 },
		{ time: '2017-04-20', value: 81.89 },
		{ time: '2017-04-21', value: 91.89 },
		{ time: '2017-04-22', value: 81.89 },
		{ time: '2017-04-23', value: 91.89 },
	]);

	line.setMarkers([
		{ time: '2017-04-10', position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: '2017-04-16', position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: '2017-04-17', position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: '2017-04-18', position: 'inBar', color: 'orange', shape: 'circle' },
		{ time: '2017-04-24', position: 'inBar', color: 'orange', shape: 'circle' },
	]);

	line.setData([
		{ time: '2017-04-10', value: 85.01 },
		{ time: '2017-04-11', value: 80.01 },
		{ time: '2017-04-12', value: 96.63 },
		{ time: '2017-04-13', value: 76.64 },
		{ time: '2017-04-14', value: 81.89 },
		{ time: '2017-04-15', value: 74.43 },
		{ time: '2017-04-16', value: 85.01 },
		{ time: '2017-04-17', value: 80.01 },
		{ time: '2017-04-18', value: 85.01 },
		{ time: '2017-04-19', value: 91.89 },
		{ time: '2017-04-20', value: 81.89 },
		{ time: '2017-04-21', value: 91.89 },
		{ time: '2017-04-22', value: 81.89 },
		{ time: '2017-04-23', value: 91.89 },
		{ time: '2017-04-24', value: 85.01 },
	]);

	chart.timeScale().fitContent();
}
