function simpleData() {
	return [
		{ time: 1663740000, value: 10 },
		{ time: 1663750000, value: 20 },
		{ time: 1663760000, value: 30 },
	];
}

function interactionsToPerform() {
	return [
		{ action: 'scrollUpRight', target: 'pane' },
		{ action: 'scrollDownLeft', target: 'pane' },
	];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		handleScale: false,
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(simpleData());

	return Promise.resolve();
}

function afterInteractions() {
	chart.applyOptions({
		handleScale: {
			axisPressedMouseMove: true,
		},
	});
	return Promise.resolve();
}
