function interactionsToPerform() {
	return [
		{ action: 'moveMouseCenter', target: 'container' },
		{ action: 'moveMouseTopLeft', target: 'container' },
		{ action: 'moveMouseCenter', target: 'container' },
	];
}

let mainSeries;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	mainSeries = chart.addBaselineSeries();

	const data = generateLineData();
	mainSeries.setData(data);

	mainSeries.setMarkers([
		{ time: data[data.length - 7].time, position: 'belowBar', color: 'rgb(255, 0, 0)', shape: 'arrowUp', text: 'test' },
		{ time: data[data.length - 5].time, position: 'aboveBar', color: 'rgba(255, 255, 0, 1)', shape: 'arrowDown', text: 'test' },
		{ time: data[data.length - 3].time, position: 'inBar', color: '#f0f', shape: 'circle', text: 'test' },
		{ time: data[data.length - 1].time, position: 'belowBar', color: '#fff00a', shape: 'square', text: 'test', size: 2 },
	]);

	mainSeries.markers();

	return Promise.resolve();
}

function afterInteractions() {
	mainSeries.setMarkers([]);
	return Promise.resolve();
}
