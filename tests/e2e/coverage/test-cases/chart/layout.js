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

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		layout: {
			background: {
				type: LightweightCharts.ColorType.VerticalGradient,
				topColor: '#FFFFFF',
				bottomColor: '#AAFFAA',
			},
		},
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(simpleData());

	return Promise.resolve();
}

function afterInteractions() {
	chart.applyOptions({
		layout: {
			background: {
				type: LightweightCharts.ColorType.Solid,
				color: 'transparent',
			},
			fontFamily: undefined,
		},
	});
	return Promise.resolve();
}
