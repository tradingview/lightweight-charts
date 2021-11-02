function runTestCase(container) {
	const chart = LightweightCharts.createChart(container);

	const candlestickSeries = chart.addCandlestickSeries();
	candlestickSeries.setData([
		{ time: '2021-10-01', open: 100, high: 110, low: 100, close: 110 },
		{ time: '2021-10-02', open: 110, high: 110, low: 100, close: 100 },
		{ time: '2021-10-03', open: 100, high: 110, low: 100, close: 110 },
		{ time: '2021-10-04', open: 120, high: 130, low: 120, close: 125 },
		{ time: '2021-10-05', open: 125, high: 125, low: 120, close: 120 },
	]);

	candlestickSeries.setMarkers([
		{ time: '2021-10-01', position: 'belowBar', shape: 'arrowUp' },
		{ time: '2021-10-02', position: 'belowBar', shape: 'arrowUp' },
		{ time: '2021-10-03', position: 'belowBar', shape: 'arrowUp' },
		{ time: '2021-10-04', position: 'aboveBar', shape: 'arrowDown' },
		{ time: '2021-10-05', position: 'aboveBar', shape: 'arrowDown' },
	]);

	candlestickSeries.update({ time: '2021-10-05', open: 120, high: 130, low: 99, close: 105 });

	chart.timeScale().fitContent();
}
