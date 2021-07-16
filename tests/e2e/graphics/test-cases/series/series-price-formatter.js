function runTestCase(container) {
	const chart = LightweightCharts.createChart(container);

	const lineSeries = chart.addLineSeries();

	lineSeries.priceFormatter().format(12.1);

	lineSeries.applyOptions({
		priceFormat: LightweightCharts.PriceScaleMode.Logarithmic,
	});
	lineSeries.priceFormatter().format(12.1);

	lineSeries.applyOptions({
		priceFormat: LightweightCharts.PriceScaleMode.Percentage,
	});
	lineSeries.priceFormatter().format(12.1);

	lineSeries.applyOptions({
		priceFormat: LightweightCharts.PriceScaleMode.IndexedTo100,
	});
	lineSeries.priceFormatter().format(12.1);
}
