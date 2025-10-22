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
			customConflationRules: {
				rules: [
					{ barsToMerge: 5, forBarSpacingLargerThan: 0.3 },
					{ barsToMerge: 10, forBarSpacingLargerThan: 0.1 },
					{ barsToMerge: 200, forBarSpacingLargerThan: 0.005 },
				],
				replaceDefaults: true,
			},
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
