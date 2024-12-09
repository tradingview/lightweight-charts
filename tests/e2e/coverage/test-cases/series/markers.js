function interactionsToPerform() {
	return [
		{ action: 'moveMouseCenter', target: 'container' },
		{ action: 'moveMouseTopLeft', target: 'container' },
		{ action: 'moveMouseCenter', target: 'container' },
	];
}

let seriesMarkerPrimitives;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.BaselineSeries);

	const data = generateLineData();
	mainSeries.setData(data);
	seriesMarkerPrimitives = LightweightCharts.createSeriesMarkers(
		mainSeries,
		[
			{ time: data[data.length - 7].time, position: 'belowBar', color: 'rgb(255, 0, 0)', shape: 'arrowUp', text: 'test' },
			{ time: data[data.length - 5].time, position: 'aboveBar', color: 'rgba(255, 255, 0, 1)', shape: 'arrowDown', text: 'test' },
			{ time: data[data.length - 3].time, position: 'inBar', color: '#f0f', shape: 'circle', text: 'test' },
			{ time: data[data.length - 1].time, position: 'belowBar', color: '#fff00a', shape: 'square', text: 'test', size: 2 },
		]
	);

	seriesMarkerPrimitives.markers();
	seriesMarkerPrimitives.getSeries();
	seriesMarkerPrimitives.applyOptions({});
	return Promise.resolve();
}

function afterInteractions() {
	seriesMarkerPrimitives.setMarkers([]);
	seriesMarkerPrimitives.detach();
	return Promise.resolve();
}
