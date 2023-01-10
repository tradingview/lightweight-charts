function simpleData() {
	return [
		{ time: 1663740000, value: 10 },
		{ time: 1663740005, value: 20 },
		{ time: 1663740010, value: 30 },
	];
}

function interactionsToPerform() {
	return [];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		timeScale: {
			secondsVisible: true,
		},
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(simpleData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	chart.applyOptions({
		timeScale: {
			timeVisible: true,
		},
	});
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
