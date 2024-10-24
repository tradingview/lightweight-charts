// Ignore the mouse movement because we are using setCrosshairPosition
window.ignoreMouseMove = true;

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));

	const mainSeries = chart.addLineSeries({
		pointMarkersVisible: true,
		pointMarkersRadius: 8,
	});

	mainSeries.setData([
		{
			time: '2024-01-01',
			value: 100,
		},
		{
			time: '2024-01-02',
			value: 200,
		},
		{
			time: '2024-01-03',
			value: 150,
		},
		{
			time: '2024-01-04',
			value: 170,
		},
	]);

	chart.timeScale().applyOptions({ barSpacing: 27.701, fixRightEdge: true, rightOffset: 0 });
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				chart.setCrosshairPosition(
					200,
					{ year: 2024, month: 1, day: 2 },
					mainSeries
				);
				resolve();
			});
		});
	});
}
