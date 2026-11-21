function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries);

	mainSeries.setData([
		{ time: '2019-01-01', value: 10 },
		{ time: '2019-01-02', value: 20 },
		{ time: '2019-01-03', value: 30 },
		{ time: '2019-01-04', value: 40 },
		{ time: '2019-01-05', value: 50 },
		{ time: '2019-01-06', value: 60 },
		{ time: '2019-01-07', value: 70 },
	]);

	chart.timeScale().setVisibleLogicalRange({ from: 0, to: 6 });

	// the range above is only applied on the next frame, and prepending older
	// bars in the meantime must not change which bars it refers to (issue #1107)
	mainSeries.setData([
		{ time: '2018-01-01', value: 200 },
		{ time: '2018-01-02', value: 190 },
		{ time: '2018-01-03', value: 180 },
		{ time: '2018-01-04', value: 170 },
		{ time: '2018-01-05', value: 160 },
		{ time: '2019-01-01', value: 10 },
		{ time: '2019-01-02', value: 20 },
		{ time: '2019-01-03', value: 30 },
		{ time: '2019-01-04', value: 40 },
		{ time: '2019-01-05', value: 50 },
		{ time: '2019-01-06', value: 60 },
		{ time: '2019-01-07', value: 70 },
	]);
}
