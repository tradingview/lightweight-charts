// Exercise the toolkit helper through a published plugin
// and a real browser canvas, whose roundRect rejects negative radii.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container);
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {
		radius: 1, segmentBorderWidth: 4, segmentBorderColor: '#000000',
		colors: ['#00ff00'], priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(Array.from({ length: 8 }, (_, i) => ({ time: 1704067200 + i * 86400, values: [10] })));
	chart.timeScale().fitContent();
}
