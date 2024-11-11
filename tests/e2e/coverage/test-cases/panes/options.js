function simpleData() {
	return [
		{ time: 1663740000, value: 10 },
		{ time: 1663750000, value: 20 },
		{ time: 1663760000, value: 30 },
	];
}

function interactionsToPerform() {
	return [
		{ action: 'moveMouseCenter', target: 'paneSeparator' },
		{ action: 'verticalDrag', target: 'paneSeparator' },
		{ action: 'verticalDrag', target: 'paneSeparator' },
	];
}

let chart;
function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, { layout: { panes: { separatorColor: '#00ff00', separatorHoverColor: '#ff0000', enableResize: true } } });

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);
	const secondSeries = chart.addSeries(LightweightCharts.LineSeries, {}, 1);

	mainSeries.setData(simpleData());
	secondSeries.setData(simpleData());

	return Promise.resolve();
}

function afterInteractions() {
	chart.applyOptions({ layout: { panes: { separatorColor: '#ff0000', separatorHoverColor: '#ff0000', enableResize: false } } });
	return Promise.resolve();
}
