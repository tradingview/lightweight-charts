// Both extended endpoints start with NaN x coordinates.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container);
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries(), {
		lineVisible: false, priceLineVisible: false, lastValueVisible: false,
		colors: [{ line: '#00ff00', area: '#00ff00' }, { line: '#00ff00', area: '#00ff00' }],
	});
	series.setData(Array.from({ length: 100 }, (_, i) => ({ time: 1704067200 + i * 86400, values: [10, 20] })));
	// Deliberately before the first draw: no previously computed coordinates.
	chart.timeScale().setVisibleLogicalRange({ from: 10, to: 20 });
}
