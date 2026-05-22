/* global dispatchPointerAt, interactivePaneElement, waitForNextFrame */

function interactionsToPerform() {
	return [];
}

const fillSeriesData = [
	{ time: '2020-01-01', value: 80 },
	{ time: '2020-01-02', value: 50 },
	{ time: '2020-01-03', value: 80 },
];

const overlayLineData = [
	{ time: '2020-01-01', value: 65 },
	{ time: '2020-01-02', value: 65 },
	{ time: '2020-01-03', value: 65 },
];

const hoverTargets = [];

function addReferenceLine(chart, pane) {
	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#0000ff',
		lineWidth: 4,
		priceLineVisible: false,
	}, pane.paneIndex());
	lineSeries.setData(overlayLineData);
}

function addChartContainer(container) {
	const chartContainer = document.createElement('div');
	chartContainer.style.height = '300px';
	chartContainer.style.marginBottom = '12px';
	container.appendChild(chartContainer);
	return chartContainer;
}

function createSplitChart(container) {
	const chart = LightweightCharts.createChart(addChartContainer(container), {
		addDefaultPane: false,
		hoveredSeriesOnTop: true,
		rightPriceScale: { visible: false },
		crosshair: {
			horzLine: { visible: false },
			vertLine: { visible: false },
		},
		layout: { attributionLogo: false },
	});

	const areaPane = chart.addPane(true);
	const fillOnlyAreaPane = chart.addPane(true);
	const baselinePane = chart.addPane(true);

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: '#ff0000',
		lineWidth: 4,
		pointMarkersVisible: true,
		pointMarkersRadius: 4,
		priceLineVisible: false,
		relativeGradient: true,
	}, areaPane.paneIndex());
	areaSeries.setData(fillSeriesData);
	areaSeries.createPriceLine({
		price: 80,
		color: '#111111',
		lineWidth: 2,
		axisLabelVisible: false,
	});
	addReferenceLine(chart, areaPane);

	const fillOnlyAreaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineVisible: false,
		pointMarkersVisible: false,
		priceLineVisible: false,
	}, fillOnlyAreaPane.paneIndex());
	fillOnlyAreaSeries.setData(fillSeriesData);
	addReferenceLine(chart, fillOnlyAreaPane);

	const baselineSeries = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 60 },
		topLineColor: '#ff0000',
		bottomLineColor: '#ff0000',
		lineWidth: 4,
		pointMarkersVisible: true,
		pointMarkersRadius: 4,
		priceLineVisible: false,
		relativeGradient: true,
	}, baselinePane.paneIndex());
	baselineSeries.setData(fillSeriesData);
	baselineSeries.createPriceLine({
		price: 80,
		color: '#222222',
		lineWidth: 2,
		axisLabelVisible: false,
	});
	addReferenceLine(chart, baselinePane);

	chart.timeScale().fitContent();
	hoverTargets.push(
		{ chart, pane: areaPane, series: areaSeries, updateOptions: { lineWidth: 5 } },
		{ chart, pane: fillOnlyAreaPane, series: fillOnlyAreaSeries, updateOptions: { topColor: 'rgba(255, 0, 0, 0.4)' } },
		{ chart, pane: baselinePane, series: baselineSeries, updateOptions: { lineWidth: 5 } }
	);
}

function createDisabledChart(container) {
	const chart = LightweightCharts.createChart(addChartContainer(container), {
		hoveredSeriesOnTop: false,
		rightPriceScale: { visible: false },
		crosshair: {
			horzLine: { visible: false },
			vertLine: { visible: false },
		},
		layout: { attributionLogo: false },
	});

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: '#ff0000',
		lineWidth: 4,
		pointMarkersVisible: true,
		pointMarkersRadius: 4,
		priceLineVisible: false,
	});
	areaSeries.setData(fillSeriesData);

	const baselineSeries = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 60 },
		topLineColor: '#008000',
		bottomLineColor: '#008000',
		lineWidth: 4,
		pointMarkersVisible: true,
		pointMarkersRadius: 4,
		priceLineVisible: false,
	});
	baselineSeries.setData([
		{ time: '2020-01-01', value: 20 },
		{ time: '2020-01-02', value: 35 },
		{ time: '2020-01-03', value: 20 },
	]);

	addReferenceLine(chart, chart.panes()[0]);
	chart.timeScale().fitContent();
	hoverTargets.push(
		{ chart, pane: chart.panes()[0], series: areaSeries, updateOptions: { lineWidth: 5 } },
		{ chart, pane: chart.panes()[0], series: baselineSeries, time: '2020-01-02', value: 35, updateOptions: { lineWidth: 5 } }
	);
}

function beforeInteractions(container) {
	container.innerHTML = '';
	createSplitChart(container);
	createDisabledChart(container);
	return waitForNextFrame();
}

async function hoverAndRender({ chart, pane, series, time = '2020-01-02', value = 50, updateOptions }) {
	const x = chart.timeScale().timeToCoordinate(time);
	const y = series.priceToCoordinate(value);
	const paneElement = interactivePaneElement(pane.getHTMLElement());
	if (x === null || y === null || paneElement === null) {
		throw new Error('Expected hover coordinates to be available.');
	}

	dispatchPointerAt(paneElement, Math.round(x), Math.round(y));
	await waitForNextFrame(50);
	if (updateOptions !== undefined) {
		series.applyOptions(updateOptions);
		dispatchPointerAt(paneElement, Math.round(x), Math.round(y));
		await waitForNextFrame();
	}
	chart.takeScreenshot(true, true);
	await waitForNextFrame();
}

async function afterInteractions() {
	for (const target of hoverTargets) {
		await hoverAndRender(target);
	}
}
