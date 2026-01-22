function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			visible: true,
			tickMarkDensity: 15,
		},
		layout: { attributionLogo: false },
	});

	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData([
		{ time: '2018-12-22', value: 10 },
		{ time: '2018-12-23', value: 20 },
		{ time: '2018-12-24', value: 30 },
		{ time: '2018-12-25', value: 40 },
		{ time: '2018-12-26', value: 50 },
		{ time: '2018-12-27', value: 60 },
		{ time: '2018-12-28', value: 70 },
		{ time: '2018-12-29', value: 80 },
		{ time: '2018-12-30', value: 90 },
		{ time: '2018-12-31', value: 100 },
	]);

	chart.timeScale().fitContent();
}
