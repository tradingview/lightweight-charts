// Consecutive conflated bars have logical stride > 1.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container, {
		timeScale: { enableConflation: true, minBarSpacing: 0.1, barSpacing: 0.1 },
	});
	const paneView = new LwcPlugin.StackedAreaSeries();
	const series = chart.addCustomSeries(paneView, {
		priceLineVisible: false, lastValueVisible: false,
		lineVisible: false, colors: [{ line: '#00ff00', area: '#00ff00' }],
	});
	series.setData(Array.from({ length: 8000 }, (_, i) => ({ time: 1704067200 + (i < 4000 ? i : i + 512) * 86400, values: [10, 20] })));
	// An invisible reference series keeps the skipped times on the common scale.
	const reference = chart.addSeries(LightweightCharts.LineSeries, { visible: false });
	reference.setData(Array.from({ length: 8512 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 0 })));
	chart.timeScale().fitContent();
}
