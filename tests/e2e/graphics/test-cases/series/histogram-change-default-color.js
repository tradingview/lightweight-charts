function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const series = chart.addHistogramSeries({
		color: 'blue',
	});

	series.setData([
		{ time: '2019-05-22', value: 35 },
		{ time: '2019-05-23', value: 10, color: 'red' },
		{ time: '2019-05-24', value: 20, color: 'green' },
		{ time: '2019-05-28', value: 30 },
	]);

	series.applyOptions({
		color: 'orange',
	});
}
