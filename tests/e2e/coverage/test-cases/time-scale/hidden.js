function interactionsToPerform() {
	return [];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		timeScale: {
			visible: false,
		},
	});

	const mainSeries = chart.addSeries(LightweightCharts.CandlestickSeries);

	mainSeries.setData(generateBars());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	chart.applyOptions({
		timeScale: {
			visible: true,
		},
	});
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
