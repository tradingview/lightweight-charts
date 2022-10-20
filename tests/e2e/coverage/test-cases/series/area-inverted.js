function interactionsToPerform() {
	return [];
}

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addAreaSeries({
		invertFilledArea: true,
	});

	mainSeries.setData(generateLineData());

	await awaitNewFrame();

	mainSeries.applyOptions({
		invertFilledArea: false,
	});

	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
