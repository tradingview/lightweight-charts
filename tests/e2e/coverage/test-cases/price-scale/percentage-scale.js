function interactionsToPerform() {
	return [
		{ action: 'scrollUp', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
	];
}

let mainSeries;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	mainSeries = chart.addLineSeries();
	chart.priceScale('right').applyOptions({
		mode: LightweightCharts.PriceScaleMode.Percentage,
		invertScale: true,
	});

	mainSeries.setData(generateLineData());

	return Promise.resolve();
}

function afterInteractions() {
	mainSeries.coordinateToPrice(300);
	mainSeries.priceToCoordinate(300);
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
