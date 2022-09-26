function interactionsToPerform() {
	return [];
}

let chart;
let overlaySeries;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateLineData());

	overlaySeries = chart.addAreaSeries({
		priceScaleId: 'overlay-id',
		priceFormat: {
			type: 'volume',
		},
		lastPriceAnimation: LightweightCharts.LastPriceAnimationMode.Continuous,
	});
	overlaySeries.setData(generateLineData());

	chart.priceScale('overlay-id').width();

	return Promise.resolve();
}

function afterInteractions() {
	chart.removeSeries(overlaySeries);
	return Promise.resolve();
}
