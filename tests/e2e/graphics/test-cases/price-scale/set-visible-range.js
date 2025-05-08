function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container));
	const series = chart.addSeries(LightweightCharts.CandlestickSeries);

	series.setData([
		{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
	]);

	chart.timeScale().fitContent();
	chart.priceScale('right').setVisibleRange({ from: 10, to: 100 });
}
