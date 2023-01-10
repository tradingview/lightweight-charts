function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const lineSeries = chart.addLineSeries();

	lineSeries.setData([
		{ time: 1556877600, value: 230.12 },
		{ time: 1556881200, value: 230.24 },
		{ time: 1556884800, value: 230.63 },
		{ time: 1556888400, value: 231.35 },
		{ time: 1556892000, value: 232.24 },
		{ time: 1556895600, value: 232.52 },
	]);

	const lineSeries1 = chart.addLineSeries({
		color: 'red',
	});

	lineSeries1.setData([
		{ time: 1556874200, value: 125.12 },
		{ time: 1556877600, value: 130.12 },
		{ time: 1556881000, value: 130.24 },
		{ time: 1556884800, value: 130.63 },
		{ time: 1556888400, value: 131.35 },
		{ time: 1556892000, value: 132.24 },
		{ time: 1556895600, value: 132.52 },
	]);

	lineSeries.setMarkers([
		{
			color: 'green',
			position: 'inBar',
			shape: 'arrowDown',
			time: 1556870600,
		},
	]);

	chart.timeScale().fitContent();
}
