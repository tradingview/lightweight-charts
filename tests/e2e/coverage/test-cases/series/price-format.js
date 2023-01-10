function interactionsToPerform() {
	return [];
}

function priceFormatter(price) {
	return '£' + price.toFixed(2);
}

let mainSeries;

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);

	mainSeries = chart.addLineSeries({
		priceFormat: {
			type: 'custom',
			minMove: 0.02,
			formatter: priceFormatter,
		},
	});

	mainSeries.setData(generateLineData());

	const overlaySeries = chart.addAreaSeries({
		priceScaleId: 'overlay-id',
		priceFormat: {
			type: 'volume',
		},
	});
	overlaySeries.setData(generateLineData());

	// Should be a volume, therefore test the various states for the formatter.
	overlaySeries.priceFormatter().format(1);
	overlaySeries.priceFormatter().format(0.001);
	overlaySeries.priceFormatter().format(1234);
	overlaySeries.priceFormatter().format(1234567);
	overlaySeries.priceFormatter().format(1234567890);

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	mainSeries.applyOptions({
		priceFormat: {
			type: 'price',
			minMove: 1,
			precision: undefined,
		},
	});
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}
