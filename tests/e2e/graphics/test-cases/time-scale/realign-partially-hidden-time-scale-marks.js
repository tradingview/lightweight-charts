function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		handleScroll: false,
		handleScale: false,
	});

	const mainSeries = chart.addLineSeries();

	const data = [
		{ time: 1639037531, value: 41.162 },
		{ time: 1639040640, value: 41.366 },
		{ time: 1639040700, value: 41.37 },
		{ time: 1639040760, value: 41.372 },
		{ time: 1639040940, value: 41.341 },
		{ time: 1639041000, value: 41.334 },
	];

	mainSeries.setData(data);

	chart.timeScale().setVisibleLogicalRange({ from: 0.5, to: data.length - 1.5 });
}
