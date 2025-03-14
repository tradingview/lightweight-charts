function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const line = chart.addSeries(LightweightCharts.LineSeries);
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

	LightweightCharts.createSeriesMarkers(
		line,
		[
			{ time: '2017-04-11', position: 'atPriceBottom', color: 'orange', shape: 'arrowUp', price: 80.01 },
			{ time: '2017-04-11', position: 'atPriceTop', color: 'orange', shape: 'arrowDown', price: 80.01 },
			{ time: '2017-04-15', position: 'atPriceMiddle', color: 'orange', shape: 'circle', price: 74.43 },
			{ time: '2017-04-22', position: 'atPriceBottom', color: 'orange', shape: 'arrowUp', price: 76.0 },
			{ time: '2017-04-22', position: 'atPriceTop', color: 'orange', shape: 'arrowDown', price: 86.0 },
			{ time: '2017-04-22', position: 'atPriceMiddle', color: 'orange', shape: 'circle', price: 80.0 },
		]
	);

	chart.timeScale().fitContent();
}
