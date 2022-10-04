function compare(markers, seriesApiMarkers) {
	return JSON.stringify(markers) === JSON.stringify(seriesApiMarkers);
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);
	const series = chart.addAreaSeries();
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-27', value: 3 },
		{ time: '1990-04-29', value: 4 },
		{ time: '1990-04-30', value: 5 },
	]);

	const markers = [
		{ time: '1990-04-24', position: 'belowBar', color: 'orange', shape: 'arrowUp' },
		{ time: '1990-04-25', position: 'belowBar', color: 'yellow', shape: 'arrowUp' },
		{ time: '1990-04-26', position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: '1990-04-27', position: 'aboveBar', color: 'orange', shape: 'arrowDown' },
		{ time: '1990-04-29', position: 'aboveBar', color: 'yellow', shape: 'arrowDown' },
		{ time: '1990-04-30', position: 'aboveBar', color: 'red', shape: 'arrowDown' },
	];

	series.setMarkers(markers);
	const seriesApiMarkers = series.markers();

	chart.applyOptions({
		watermark: {
			color: 'red',
			visible: true,
			text: JSON.stringify(seriesApiMarkers[0]),
		},
	});

	console.assert(compare(markers, seriesApiMarkers), `series.markers() should return exactly the same that was provided to series.setMarkers()\n${JSON.stringify(seriesApiMarkers)}`);
}
