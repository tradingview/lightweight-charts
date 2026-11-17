let clickParams;
let crosshairMoves = 0;
let series;

function initialInteractionsToPerform() {
	return [];
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
	LightweightCharts.createSeriesMarkers(series, [{
		time: '2020-01-02', position: 'inBar', shape: 'circle', color: 'red', size: 3, id: 'touch-marker',
	}]);
	chart.subscribeClick(params => { clickParams = params; });
	chart.subscribeCrosshairMove(() => { crosshairMoves += 1; });
	await new Promise(resolve => requestAnimationFrame(resolve));
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	if (!clickParams || clickParams.hoveredObjectId !== 'touch-marker' || clickParams.hoveredSeries !== series) {
		throw new Error(`Expected a touch tap to hit the marker: ${JSON.stringify(clickParams && { id: clickParams.hoveredObjectId, point: clickParams.point })}`);
	}
	if (!clickParams.hoveredInfo || clickParams.hoveredInfo.type !== 'marker' || clickParams.hoveredInfo.objectKind !== 'series-marker') {
		throw new Error('Expected marker hit metadata for a touch tap.');
	}
	if (crosshairMoves !== 0) {
		throw new Error('A tap must not enter crosshair tracking mode.');
	}
	return Promise.resolve();
}
