// Ignore the mouse movement because we need to test without the mouse
window.ignoreMouseMove = true;

function runTestCase(container) {
	// Prevent the chart from getting a mouse event;
	container.style.setProperty('pointer-events', 'none');

	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		crosshairMarkerVisible: true,
		crosshairMarkerRadius: 12,
		crosshairMarkerBackgroundColor: 'red',
	});

	lineSeries.setData([
		{ time: '2018-12-20', value: 10 },
		{ time: '2018-12-21', value: 16 },
		{ time: '2018-12-22', value: 21 },
		{ time: '2018-12-23', value: 25 },
		{ time: '2018-12-24', value: 28 },
		{ time: '2018-12-25', value: 30 },
		{ time: '2018-12-26', value: 28 },
		{ time: '2018-12-27', value: 25 },
		{ time: '2018-12-28', value: 21 },
		{ time: '2018-12-29', value: 16 },
		{ time: '2018-12-30', value: 10 },
		{ time: '2018-12-31', value: 3 },
	]);
}
