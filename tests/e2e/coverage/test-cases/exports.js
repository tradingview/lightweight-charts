function interactionsToPerform() {
	return [];
}

function beforeInteractions() {
	console.log(LightweightCharts.TrackingModeExitMode);
	console.log(LightweightCharts.MismatchDirection);
	console.log(LightweightCharts.PriceLineSource);
	console.log(LightweightCharts.TickMarkType);
	console.log(LightweightCharts.version());
	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
