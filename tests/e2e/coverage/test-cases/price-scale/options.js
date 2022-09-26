function interactionsToPerform() {
	return [];
}

async function awaitNewFrame() {
	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
			mode: LightweightCharts.PriceScaleMode.Logarithmic,
		},
		rightPriceScale: {
			visible: true,
			mode: LightweightCharts.PriceScaleMode.Percentage,
		},
	});

	const areaSeries = chart.addAreaSeries();

	areaSeries.setData(generateLineData());

	const lineSeries = chart.addLineSeries({ priceScaleId: 'left' });
	lineSeries.setData(generateLineData());

	await awaitNewFrame();

	chart.priceScale('left').width();
	chart.priceScale('right').width();
	chart.priceScale('right').applyOptions({});

	await awaitNewFrame();

	chart.applyOptions({
		leftPriceScale: {
			mode: LightweightCharts.PriceScaleMode.IndexedTo100,
		},
		rightPriceScale: {
			mode: LightweightCharts.PriceScaleMode.Normal,
			invertScale: true,
			alignLabels: false,
		},
	});

	chart.priceScale('right').applyOptions({
		borderVisible: false,
		ticksVisible: false,
		mode: LightweightCharts.PriceScaleMode.Logarithmic,
	});

	await awaitNewFrame();

	lineSeries.applyOptions({ priceScaleId: 'right' });
	areaSeries.applyOptions({ priceScaleId: 'left' });

	chart.priceScale('right').applyOptions({
		borderVisible: true,
		ticksVisible: true,
	});

	areaSeries.coordinateToPrice(10);
	areaSeries.priceToCoordinate(200);

	try {
		chart.priceScale();
	} catch {
		console.log('expected error');
	}

	return Promise.resolve();
}

function afterInteractions() {
	return Promise.resolve();
}
