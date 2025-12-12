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
			conflationThresholdFactor: 2,
		},
	});

	const mainSeries = chart.addSeries(LightweightCharts.HistogramSeries);
	const data = generateHistogramData();
	mainSeries.setData(data);

	return new Promise(resolve => {
		mainSeries.applyOptions({ conflationThresholdFactor: 4 });
		mainSeries.update({
			...data[data.length - 1],
			value: data[data.length - 1].value + 10,
		});
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
