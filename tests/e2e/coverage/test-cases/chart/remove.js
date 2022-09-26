function interactionsToPerform() {
	return [];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);
	return Promise.resolve();
}

function afterInteractions() {
	chart.remove();
	chart = null;
	return Promise.resolve();
}
