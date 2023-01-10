function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries({
		lineType: LightweightCharts.LineType.WithSteps,
	});

	mainSeries.setData([
		{ time: 1, value: 1, color: 'red' },
		{ time: 2, value: 2, color: 'green' },
		{ time: 3, value: 1, color: 'blue' },
	]);

	chart.timeScale().fitContent();
}
