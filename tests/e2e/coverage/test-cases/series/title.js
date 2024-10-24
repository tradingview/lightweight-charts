function interactionsToPerform() {
	return [];
}

let mainSeries;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	mainSeries = chart.addBarSeries({
		title: 'Initial title',
		priceFormat: {
			type: 'percent',
		},
	});

	mainSeries.setData(generateBars());
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	mainSeries.applyOptions({
		title: 'Updated title',
	});
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
