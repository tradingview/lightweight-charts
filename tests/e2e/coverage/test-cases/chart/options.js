function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addAreaSeries();

	mainSeries.setData(generateLineData());

	chart.options();

	chart.applyOptions({
		localization: {
			dateFormat: 'yyyy MM dd',
		},
	});

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	return Promise.resolve();
}
