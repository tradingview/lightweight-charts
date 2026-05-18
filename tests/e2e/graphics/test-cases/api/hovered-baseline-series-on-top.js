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

	const baselineSeries = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 60 },
		topLineColor: '#ff0000',
		bottomLineColor: '#ff0000',
		topFillColor1: 'rgba(255, 0, 0, 0.85)',
		topFillColor2: 'rgba(255, 0, 0, 0.65)',
		bottomFillColor1: 'rgba(255, 0, 0, 0.65)',
		bottomFillColor2: 'rgba(255, 0, 0, 0.85)',
		lineWidth: 6,
		pointMarkersVisible: true,
		pointMarkersRadius: 4,
	});
	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#0000ff',
		lineWidth: 8,
	});

	const baselineData = [
		{ time: '2020-01-01', value: 80 },
		{ time: '2020-01-02', value: 50 },
		{ time: '2020-01-03', value: 80 },
	];
	const lineData = [
		{ time: '2020-01-01', value: 50 },
		{ time: '2020-01-02', value: 50 },
		{ time: '2020-01-03', value: 50 },
	];

	baselineSeries.setData(baselineData);
	lineSeries.setData(lineData);
	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			setTimeout(() => {
				const hoverX = chart.timeScale().timeToCoordinate(baselineData[0].time);
				const hoverY = baselineSeries.priceToCoordinate(baselineData[0].value);
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
