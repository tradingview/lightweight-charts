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
		mode: LightweightCharts.PriceScaleMode.Percentage,
		invertScale: true,
	});

	await awaitNewFrame();
	chart.priceScale('right').applyOptions({
		mode: LightweightCharts.PriceScaleMode.IndexedTo100,
		invertScale: false,
	});

	await awaitNewFrame();
	chart.priceScale('right').applyOptions({
		mode: LightweightCharts.PriceScaleMode.Logarithmic,
	});

	await awaitNewFrame();
	chart.priceScale('right').applyOptions({
		mode: LightweightCharts.PriceScaleMode.Normal,
	});

	return Promise.resolve();
}

function afterInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
