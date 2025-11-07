/*
	Enabling `doNotSnapToHiddenSeriesIndices` option and hiding the areaSeries.
	When we try set the crosshair position to point only specified by the area
	series then the crosshair should rather snap to closest value of a visible
	series.

	Expected: crosshair should be on '2018-12-30' (not '2018-12-28')
 */

// Ignore the mouse movement because we need to test without the mouse
window.ignoreMouseMove = true;

function runTestCase(container) {
	// Prevent the chart from getting a mouse event;
	container.style.setProperty('pointer-events', 'none');

	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		autoSize: true,
		crosshair: {
			doNotSnapToHiddenSeriesIndices: true,
			vertLine: {
				color: 'rgb(255,0,0)',
				width: 4,
			},
			horzLine: {
				color: 'rgb(0,255,0)',
				width: 4,
			},
		},
	}));

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		visible: false,
	});

	areaSeries.setData([
		{ time: '2018-12-22', value: 32.51 },
		{ time: '2018-12-23', value: 31.11 },
		{ time: '2018-12-24', value: 27.02 },
		{ time: '2018-12-25', value: 27.32 },
		{ time: '2018-12-26', value: 25.17 },
		{ time: '2018-12-27', value: 28.89 },
		{ time: '2018-12-28', value: 25.46 },
		{ time: '2018-12-29', value: 23.92 },
		{ time: '2018-12-30', value: 22.68 },
		{ time: '2018-12-31', value: 22.67 },
	]);

	const candlestickSeries = chart.addSeries(
		LightweightCharts.CandlestickSeries
	);

	candlestickSeries.setData([
		{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-30', open: 106.33, high: 110.2, low: 90.39, close: 98.1 },
		{
			time: '2018-12-31',
			open: 109.87,
			high: 114.69,
			low: 85.66,
			close: 111.26,
		},
	]);

	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			chart.setCrosshairPosition(30, '2018-12-28', areaSeries);
			requestAnimationFrame(() => resolve());
		});
	});
}
