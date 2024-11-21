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

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
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

	const mainSeries = chart.addSeries(LightweightCharts.HistogramSeries);
	mainSeries.setData(generateHistogramData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

async function afterInteractions() {
	chart.timeScale().applyOptions({
		minBarSpacing: 12,
	});

	await awaitNewFrame();

	chart.timeScale().applyOptions({
		minBarSpacing: 12,
		maxBarSpacing: 24,
	});

	await awaitNewFrame();

	chart.timeScale().applyOptions({
		minBarSpacing: 2,
		maxBarSpacing: 1,
	});

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
