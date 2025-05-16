function interactionsToPerform() {
	return [];
}

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

let mainSeries;
let chart;

async function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	mainSeries.setData(generateLineData());

	await awaitNewFrame();
	chart.priceScale('right').applyOptions({
		scaleMargins: {
			top: 0,
			bottom: 0,
		},
		ensureEdgeTickMarksVisible: true,
	});

	await awaitNewFrame();
	chart.priceScale('right').applyOptions({
		ensureEdgeTickMarksVisible: false,
	});

	return Promise.resolve();
}

function afterInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
