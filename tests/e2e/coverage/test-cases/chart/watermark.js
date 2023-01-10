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
		watermark: {
			visible: true,
			color: 'red',
			text: 'Watermark',
			fontSize: 24,
			fontStyle: 'italic',
		},
	});

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(simpleData());

	return Promise.resolve();
}

function afterInteractions() {
	chart.applyOptions({
		watermark: {
			fontFamily: 'Roboto',
			horzAlign: 'left',
			vertAlign: 'top',
		},
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			chart.applyOptions({
				watermark: {
					horzAlign: 'right',
					vertAlign: 'bottom',
				},
			});
		});
		requestAnimationFrame(resolve);
	});
}
