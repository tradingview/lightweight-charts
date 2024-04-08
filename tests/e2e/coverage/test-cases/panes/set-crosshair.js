function simpleData() {
	return [
		{ time: 1663740000, value: 10 },
		{ time: 1663750000, value: 20 },
		{ time: 1663760000, value: 30 },
	];
}

function interactionsToPerform() {
	return [];
}

let chart;
let secondSeries;
function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addLineSeries();
	secondSeries = chart.addLineSeries();

	mainSeries.setData(simpleData());
	secondSeries.setData(simpleData());

	chart.setCrosshairPosition(20, 1663750000, secondSeries);
	return Promise.resolve();
}

function afterInteractions() {
	secondSeries.applyOptions({ pane: 1 });
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			secondSeries.applyOptions({ pane: 0 });
			requestAnimationFrame(resolve);
		});
	});
}
