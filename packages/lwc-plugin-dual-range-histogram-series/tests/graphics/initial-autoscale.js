// No frame or second setData between options and ingestion.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container);
	const series = chart.addCustomSeries(new LwcPlugin.DualRangeHistogramSeries(), {
		scaleMode: 'price', baseValue: 50,
		priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(Array.from({ length: 12 }, (_, i) => ({ time: 1704067200 + i * 86400, values: [20 + i, -10 - i] })));
	chart.timeScale().fitContent();
}
