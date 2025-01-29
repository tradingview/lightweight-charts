function interactionsToPerform() {
	return [];
}

const curve1 = [
	{ time: 1, value: 5.378 },
	{ time: 2, value: 5.372 },
	{ time: 3, value: 5.271 },
	{ time: 6, value: 5.094 },
	{ time: 12, value: 4.739 },
	{ time: 24, value: 4.237 },
	{ time: 36, value: 4.036 },
	{ time: 60, value: 3.887 },
	{ time: 84, value: 3.921 },
	{ time: 120, value: 4.007 },
	{ time: 240, value: 4.366 },
	{ time: 360, value: 4.29 },
];

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createYieldCurveChart(container, {
		yieldCurve: {
			baseResolution: 1,
			minimumTimeRange: 10,
			startTimeRange: 3,
		},
		layout: {
			attributionLogo: false,
		},
	});

	const series1 = chart.addSeries(LightweightCharts.LineSeries, {
		lineType: 2,
		color: 'black',
		pointMarkersVisible: true,
	});

	const primitive = LightweightCharts.createUpDownMarkers(series1);
	primitive.setData(curve1);

	primitive.update({ time: 24, value: 4.3 }, true); // up
	primitive.update({ time: 36, value: 4.036 }, true); // neutral
	primitive.update({ time: 60, value: 3.8 }, true); // down

	chart.timeScale().fitContent();

	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
