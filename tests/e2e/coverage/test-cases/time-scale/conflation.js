let chart;

function interactionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		timeScale: {
			minBarSpacing: 0.002,
			barSpacing: 0.004,
			enableConflation: true,
			precomputeConflationOnInit: true,
			precomputeConflationPriority: 'false',
		},
	});

	const mainSeries = chart.addSeries(LightweightCharts.HistogramSeries);
	mainSeries.setData(generateHistogramData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
