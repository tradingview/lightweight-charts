function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries);

	mainSeries.setData(generateLineData());

	chart.applyOptions({
		autoSize: true,
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			container.style.height = '200px';
			container.style.width = '250px';
			requestAnimationFrame(resolve);
		});
	});
}

function afterInteractions() {
	return Promise.resolve();
}
