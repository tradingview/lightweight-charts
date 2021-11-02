function runTestCase(container) {
	const chart = LightweightCharts.createChart(container);

	const candlestickSeries = chart.addCandlestickSeries();

	candlestickSeries.setData([
		{ time: '2021-10-01', open: 100, high: 110, low: 100, close: 110 },
		{ time: '2021-10-02', open: 110, high: 110, low: 100, close: 100 },
		{ time: '2021-10-03', open: 100, high: 110, low: 100, close: 110 },
		{ time: '2021-10-04', open: 120, high: 130, low: 120, close: 125 },
	]);

	candlestickSeries.setMarkers([
		{ time: '2021-10-01', position: 'aboveBar', shape: 'circle' },
		{ time: '2021-10-02', position: 'aboveBar', shape: 'circle' },
		{ time: '2021-10-03', position: 'aboveBar', shape: 'circle' },
	]);

	candlestickSeries.setMarkers([
		{ time: '2021-10-01', position: 'aboveBar', shape: 'circle' },
	]);

	chart.timeScale().fitContent();
}
