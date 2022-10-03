function interactionsToPerform() {
	return [];
}

function beforeInteractions() {
	LightweightCharts.createChart('container');
	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
