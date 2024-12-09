function runTestCase(container) {
	const chartOptions = {
		height: 400,
		width: 600,
		rightPriceScale: {
			scaleMargins: {
				top: 0,
				bottom: 0,
			},
			entireTextOnly: true,
			alignLabels: true,
		},
		crosshair: {
			mode: 2,
		},
	};

	const chart = (window.chart = LightweightCharts.createChart(
		container,
		chartOptions
	));

	const data1 = Array.from({ length: 10 }).map((_, index) => ({ time: index * 10000, value: 1000000 * (100 - index), color: index % 2 ? '#ff0000' : '#0000ff' }));

	const series1 = chart.addSeries(LightweightCharts.LineSeries, {
		priceFormat: {
			type: 'volume',
			precision: 3,
		},
	});
	series1.setData(data1);

	chart.timeScale().fitContent();
}
