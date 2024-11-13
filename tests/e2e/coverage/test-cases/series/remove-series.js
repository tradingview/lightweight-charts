function interactionsToPerform() {
	return [];
}

let series;
let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	series = chart.addSeries(LightweightCharts.AreaSeries);

	series.setData(generateLineData());

	return Promise.resolve();
}

function afterInteractions() {
	chart.removeSeries(series);
	return Promise.resolve();
}
