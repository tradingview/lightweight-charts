function interactionsToPerform() {
	return [
		{ action: 'moveMouseCenter', target: 'container' },
		{ action: 'moveMouseTopLeft', target: 'container' },
		{ action: 'moveMouseCenter', target: 'container' },
	];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		crosshair: {
			mode: LightweightCharts.CrosshairMode.Magnet,
			vertLine: {
				labelVisible: false,
				visible: false,
			},
			horzLine: {
				labelVisible: false,
				visible: false,
			},
		},
	});

	const mainSeries = chart.addCandlestickSeries();
	mainSeries.setData(generateBars());

	const lineSeries = chart.addLineSeries({
		crosshairMarkerBorderColor: 'orange',
		crosshairMarkerBackgroundColor: 'orange',
		crosshairMarkerRadius: 6,
	});
	lineSeries.setData(generateLineData());

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	chart.applyOptions({
		crosshair: {
			mode: LightweightCharts.CrosshairMode.Normal,
			vertLine: {
				labelVisible: true,
				visible: true,
			},
			horzLine: {
				labelVisible: true,
				visible: true,
			},
		},
	});
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
