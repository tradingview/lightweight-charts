function interactionsToPerform() {
	return [
		{ action: 'longTouch', target: 'pane' },
		{ action: 'swipeTouchDiagonal', target: 'pane' },
		{ action: 'tap', target: 'container' },
		{ action: 'swipeTouchDiagonal', target: 'container' },
		{ action: 'longTouch', target: 'pane' },
	];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		trackingMode: {
			exitMode: LightweightCharts.TrackingModeExitMode.OnNextTap,
		},
	});

	const mainSeries = chart.addHistogramSeries();

	mainSeries.setData(generateHistogramData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	chart.takeScreenshot();
	return Promise.resolve();
}
