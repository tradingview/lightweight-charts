function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	});
	const data = Array.from({ length: 30 }, (_, index) => ({ time: index, value: 1e12 }));
	const options = {
		priceFormat: {
			type: 'custom',
			minMove: 1e-8,
			formatter: price => price.toFixed(2),
		},
	};

	const linear = chart.addSeries(LightweightCharts.LineSeries, options);
	linear.setData(data);

	const logarithmic = chart.addSeries(LightweightCharts.LineSeries, options, 1);
	logarithmic.priceScale().applyOptions({ mode: LightweightCharts.PriceScaleMode.Logarithmic });
	logarithmic.setData(data);

	chart.timeScale().fitContent();
}
