function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries();

	mainSeries.setData([
		{ time: 1, value: 1, color: 'red' },
		{ time: 2, value: 2, color: 'green' },
		{ time: 3, value: 3 },
		{ time: 4, value: 3 },
		{ time: 5, value: 3 },
		{ time: 6, value: 3 },
		{ time: 7, value: 3 },
		{ time: 8, value: 3 },
		{ time: 9, value: 1, color: 'blue' },
	]);

	chart.timeScale().fitContent();

	return new Promise(resolve => {
		setTimeout(() => {
			mainSeries.applyOptions({ color: 'red' });
			resolve();
		}, 300);
	});
}
