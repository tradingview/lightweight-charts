function interactionsToPerform() {
	return [
		{ action: 'scrollUp', target: 'pane' },
		{ action: 'scrollUp', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
	];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		timeScale: {
			rightOffset: 10,
			barSpacing: 3,
			minBarSpacing: 2,
		},
	});

	const mainSeries = chart.addHistogramSeries();
	mainSeries.setData(generateHistogramData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	chart.timeScale().applyOptions({
		minBarSpacing: 12,
	});
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
