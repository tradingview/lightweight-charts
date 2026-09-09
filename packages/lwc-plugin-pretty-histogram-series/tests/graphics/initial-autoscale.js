// No frame or second setData between options and ingestion.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container);
	const series = chart.addCustomSeries(new LwcPlugin.PrettyHistogramSeries(), {
		base: 100,
		priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(Array.from({ length: 12 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 30 + i })));
	chart.timeScale().fitContent();
}
