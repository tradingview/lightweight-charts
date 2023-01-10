function interactionsToPerform() {
	return [];
}

let mainSeries;
let priceLineToRemove;
let priceLine1;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	mainSeries = chart.addBarSeries();

	mainSeries.setData(generateBars());

	mainSeries.createPriceLine({
		price: 10,
		color: 'red',
		lineWidth: 1,
		lineStyle: LightweightCharts.LineStyle.Solid,
	});

	mainSeries.createPriceLine({
		price: 20,
		color: '#00FF00',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
	});

	mainSeries.createPriceLine({
		price: 30,
		color: 'rgb(0,0,255)',
		lineWidth: 3,
		lineStyle: LightweightCharts.LineStyle.Dashed,
	});

	priceLineToRemove = mainSeries.createPriceLine({
		price: 40,
		color: 'rgba(255,0,0,0.5)',
		lineWidth: 4,
		lineStyle: LightweightCharts.LineStyle.LargeDashed,
	});

	priceLine1 = mainSeries.createPriceLine({
		price: 50,
		color: '#f0f',
		lineWidth: 4,
		lineStyle: LightweightCharts.LineStyle.SparseDotted,
	});

	priceLine1.options();

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	mainSeries.removePriceLine(priceLineToRemove);
	priceLine1.applyOptions({});

	return Promise.resolve();
}
