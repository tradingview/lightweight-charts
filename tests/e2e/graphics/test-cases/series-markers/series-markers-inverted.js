function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const mainSeries = chart.addSeries(LightweightCharts.CandlestickSeries);

	const candlesticks = [
		{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-23', open: 45.12, high: 53.9, low: 45.12, close: 48.09 },
		{ time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
		{ time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.5 },
		{ time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 101.04 },
	];
	mainSeries.setData(candlesticks);

	const markers = [
		{ time: candlesticks[4].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: candlesticks[4].time, position: 'aboveBar', color: 'red', shape: 'arrowDown' },
		{ time: candlesticks[3].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: candlesticks[2].time, position: 'aboveBar', color: 'red', shape: 'arrowDown' },
	];

	const markerSeries = LightweightCharts.createSeriesMarkers(
		mainSeries,
		markers
	);

	chart.applyOptions({
		rightPriceScale: {
			invertScale: true,
		},
	});

	markerSeries.setMarkers(markers);
	chart.timeScale().fitContent();
}
