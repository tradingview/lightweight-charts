function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries);

	candleSeries.setData([
		{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-23', open: 45.12, high: 53.9, low: 45.12, close: 48.09 },
		{ time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
		{ time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.5 }, // Removed in pop(2)
		{ time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 }, // Removed in pop(2)
		{ time: '2018-12-27', open: 91.04, high: 121.4, low: 82.7, close: 111.4 }, // Removed in pop(1)
	]);

	candleSeries.pop(1);
	candleSeries.pop(2);

	chart.timeScale().fitContent();
}
