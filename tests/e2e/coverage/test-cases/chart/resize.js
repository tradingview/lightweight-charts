function interactionsToPerform() {
	return [];
}

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addHistogramSeries();

	mainSeries.setData(generateHistogramData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

async function afterInteractions() {
	chart.resize(750, 100);

	chart.applyOptions({
		timeScale: {
			barSpacing: 12,
			minBarSpacing: 2,
			rightOffset: 4,
			fixRightEdge: true,
			fixLeftEdge: true,
		},
	});
	chart.timeScale().fitContent();

	await awaitNewFrame();

	chart.resize(450, 200);

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
