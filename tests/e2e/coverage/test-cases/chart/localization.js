function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		localization: {
			locale: 'en-GB-u-ca-islamic',
		},
	});

	const mainSeries = chart.addAreaSeries();

	mainSeries.setData(generateLineData());

	chart.options();

	chart.applyOptions({
		localization: {
			dateFormat: 'yyyy MM dd',
			priceFormatter: p => `£${p.toFixed(2)}`,
			timeFormatter: t => `${t.toString()}`,
		},
	});

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	return Promise.resolve();
}
