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

let mainSeries;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	mainSeries = chart.addLineSeries();

	mainSeries.setData(generateLineData());

	// Cover edge case
	chart.timeScale().setVisibleRange({
		from: 0,
		to: 0.8,
	});

	testSeriesApi(mainSeries);
	return Promise.resolve();
}

function afterInteractions() {
	mainSeries.applyOptions({ lineType: LightweightCharts.LineType.WithSteps });
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			mainSeries.applyOptions({ lineType: LightweightCharts.LineType.Curved });
			requestAnimationFrame(resolve);
		});
	});
}
