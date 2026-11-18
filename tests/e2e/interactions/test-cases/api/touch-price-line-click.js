let clickParams;
let crosshairMoves = 0;
let series;
let priceLine;

function initialInteractionsToPerform() {
	return [{ action: 'tap', target: 'pane' }];
}

function finalInteractionsToPerform() {
	return [{ action: 'tap', target: 'pane' }];
}

async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { visible: false },
	});
	series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData([
		{ time: '2020-01-01', value: 10 },
		{ time: '2020-01-02', value: 20 },
		{ time: '2020-01-03', value: 30 },
	]);
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(resolve));
	const price = series.coordinateToPrice(chart.paneSize().height / 2);
	priceLine = series.createPriceLine({ price, id: 'touch-price-line', lineWidth: 4 });
	chart.subscribeClick(params => { clickParams = params; });
	chart.subscribeCrosshairMove(() => { crosshairMoves += 1; });
	await new Promise(resolve => requestAnimationFrame(resolve));
}

function afterInitialInteractions() {
	if (!clickParams || clickParams.hoveredObjectId !== 'touch-price-line' || clickParams.hoveredSeries !== series) {
		throw new Error(`Expected a touch tap to hit the price line: ${JSON.stringify(clickParams && { id: clickParams.hoveredObjectId, point: clickParams.point })}`);
	}
	if (!clickParams.hoveredInfo || clickParams.hoveredInfo.type !== 'price-line' || clickParams.hoveredInfo.objectKind !== 'custom-price-line') {
		throw new Error('Expected price-line hit metadata for a touch tap.');
	}
	if (crosshairMoves !== 0) {
		throw new Error('A tap must not enter crosshair tracking mode.');
	}
	priceLine.applyOptions({ price: 30 });
	clickParams = undefined;
	// Keep the next tap outside the double-tap interval.
	return new Promise(resolve => setTimeout(resolve, 600));
}

function afterFinalInteractions() {
	if (!clickParams || clickParams.hoveredObjectId !== undefined) {
		throw new Error('A later tap away from the price line must not reuse the previous hit.');
	}
	if (crosshairMoves !== 0) {
		throw new Error('A tap must not enter crosshair tracking mode.');
	}
	return Promise.resolve();
}
