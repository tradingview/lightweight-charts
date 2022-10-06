function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);
	const series = chart.addAreaSeries();
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
	]);

	console.assert(series.priceScale(), 'should be able to return price scale');
}
