function interactionsToPerform() {
	return [
		{ action: 'moveMouseCenter', target: 'container' },
		{ action: 'scrollLeft', target: 'pane' },
		{ action: 'scrollUp', target: 'pane' },
		{ action: 'scrollDown', target: 'pane' },
		{ action: 'scrollRight', target: 'pane' },
		{ action: 'scrollUpRight', target: 'pane' },
		{ action: 'scrollDownLeft', target: 'pane' },
		{ action: 'outsideClick', target: 'container' },
		{ action: 'viewportZoomInOut' },
		{ action: 'verticalDrag', target: 'leftpricescale' },
		{ action: 'verticalDrag', target: 'rightpricescale' },
		{ action: 'horizontalDrag', target: 'timescale' },
		{ action: 'verticalDrag', target: 'pane' },
		{ action: 'horizontalDrag', target: 'pane' },
		{ action: 'click', target: 'leftpricescale' },
		{ action: 'doubleClick', target: 'leftpricescale' },
		{ action: 'click', target: 'rightpricescale' },
		{ action: 'doubleClick', target: 'rightpricescale' },
		{ action: 'click', target: 'timescale' },
		{ action: 'doubleClick', target: 'timescale' },
		{ action: 'tap', target: 'container' },
		{ action: 'pinchZoomIn', target: 'container' },
		{ action: 'pinchZoomOut', target: 'container' },
		{ action: 'swipeTouchVertical', target: 'leftpricescale' },
		{ action: 'swipeTouchVertical', target: 'pane' },
		{ action: 'swipeTouchHorizontal', target: 'timescale' },
		{ action: 'swipeTouchDiagonal', target: 'container' },
		{ action: 'longTouch', target: 'container' },
		{ action: 'kineticAnimation', target: 'timescale' },
	];
}

let chart;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
			mode: LightweightCharts.PriceScaleMode.Logarithmic,
		},
		rightPriceScale: {
			visible: true,
			mode: LightweightCharts.PriceScaleMode.Percentage,
		},
		timeScale: {
			timeVisible: true,
		},
	});

	const lineSeries = chart.addLineSeries();
	lineSeries.setData(generateLineData());

	const candlestickSeries = chart.addCandlestickSeries({
		priceScaleId: 'left',
	});
	chart.priceScale('left').applyOptions({
		autoScale: false,
	});
	candlestickSeries.setData(generateBars());

	const histogramSeries = chart.addHistogramSeries({
		priceScaleId: 'overlay-1',
	});
	histogramSeries.setData(generateHistogramData());

	const barSeries = chart.addBarSeries({
		priceScaleId: 'overlay-2',
	});
	barSeries.setData(generateBars());

	const areaSeries = chart.addAreaSeries({
		priceScaleId: 'overlay-3',
	});
	areaSeries.setData(generateLineData());

	const baselineSeries = chart.addBaselineSeries({
		priceScaleId: 'overlay-4',
	});
	baselineSeries.setData(generateLineData());

	chart.timeScale().subscribeVisibleTimeRangeChange(console.log);
	chart.timeScale().subscribeVisibleLogicalRangeChange(console.log);
	chart.timeScale().subscribeSizeChange(console.log);
	chart.subscribeCrosshairMove(console.log);
	chart.subscribeClick(console.log);

	return new Promise(resolve => {
		requestAnimationFrame(resolve);
	});
}

function afterInteractions() {
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			chart.timeScale().unsubscribeVisibleTimeRangeChange(console.log);
			chart.timeScale().unsubscribeVisibleLogicalRangeChange(console.log);
			chart.timeScale().unsubscribeSizeChange(console.log);
			chart.unsubscribeCrosshairMove(console.log);
			chart.unsubscribeClick(console.log);
			resolve();
		});
	});
}
