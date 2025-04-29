function runTestCase(container) {
	const chartOptions = {
		rightPriceScale: {
			mode: 0,
			scaleMargins: {
				top: 0,
				bottom: 0,
			},
			ensureEdgeTickMarksVisible: true,
		},
	};

	const chart = (window.chart = LightweightCharts.createChart(container, chartOptions));
	const series1 = chart.addSeries(LightweightCharts.CandlestickSeries);
	const series2 = chart.addSeries(LightweightCharts.CandlestickSeries);

	series1.setData([
		{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
	]);

	series2.setData([
		{ time: '2018-12-23', open: 66.6, high: 99.54, low: 16, close: 20.72 },
		{ time: '2018-12-27', open: 33, high: 35, low: 11.68, close: 20.43 },
	]);

	chart.timeScale().fitContent();
}
