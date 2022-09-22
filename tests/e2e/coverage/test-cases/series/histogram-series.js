function interactionsToPerform() {
	return [];
}

function testSeriesApi(series) {
	series.options();
	series.coordinateToPrice(300);
	series.priceToCoordinate(300);
	series.priceScale();
	series.applyOptions({
		priceFormatter: a => a.toFixed(2),
	});
	series.priceFormatter();
	series.seriesType();
	series.markers();
	series.dataByIndex(10);
	series.dataByIndex(-5);
	series.dataByIndex(-5, LightweightCharts.MismatchDirection.NearestRight);
	series.dataByIndex(1500, LightweightCharts.MismatchDirection.NearestLeft);
	series.dataByIndex(1500, LightweightCharts.MismatchDirection.None);
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addHistogramSeries({
		autoscaleInfoProvider: original => original(),
	});

	mainSeries.setData(generateHistogramData());

	testSeriesApi(mainSeries);

	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
