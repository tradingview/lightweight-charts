let hoverPoint;

function initialInteractionsToPerform() {
	return [{ action: 'moveMouseXY', target: 'pane', options: hoverPoint }];
}

function runTestCase(container) {
	window.ignoreMouseMove = true;

	const chart = window.chart = LightweightCharts.createChart(container, {
		hoveredSeriesOnTop: true,
		crosshair: {
			horzLine: { visible: false },
			vertLine: { visible: false },
		},
		layout: { attributionLogo: false },
	});

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: '#ff0000',
		topColor: 'rgba(255, 0, 0, 0.35)',
		bottomColor: 'rgba(255, 0, 0, 0.25)',
		lineWidth: 4,
		pointMarkersVisible: true,
		pointMarkersRadius: 4,
		priceLineVisible: false,
	});
	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#0000ff',
		lineWidth: 8,
		priceLineVisible: false,
	});

	const areaData = [
		{ time: '2020-01-01', value: 80 },
		{ time: '2020-01-02', value: 50 },
		{ time: '2020-01-03', value: 80 },
	];
	const lineData = [
		{ time: '2020-01-01', value: 50 },
		{ time: '2020-01-02', value: 50 },
		{ time: '2020-01-03', value: 50 },
	];

	areaSeries.setData(areaData);
	lineSeries.setData(lineData);
	areaSeries.createPriceLine({
		price: 80,
		color: '#000000',
		lineWidth: 8,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: false,
	});
	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			setTimeout(() => {
				const hoverX = chart.timeScale().timeToCoordinate(areaData[0].time);
				const hoverY = areaSeries.priceToCoordinate(areaData[0].value);
				if (hoverX === null || hoverY === null) {
					throw new Error('Expected hover coordinates to be available.');
				}

				hoverPoint = {
					x: Math.round(hoverX),
					y: Math.round(hoverY),
				};
				resolve();
			}, 250);
		});
	});
}
