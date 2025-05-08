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
	chart.priceScale('right').setAutoScale(false);

	await awaitNewFrame();
	chart.priceScale('right').setAutoScale(true);

	await awaitNewFrame();
	chart.priceScale('right').setVisibleRange({ from: 10, to: 100 });

	return Promise.resolve();
}

function afterInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
