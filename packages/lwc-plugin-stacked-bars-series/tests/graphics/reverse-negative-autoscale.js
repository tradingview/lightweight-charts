// [10, -20] in reverse visits -20 before ending at -10.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container);
	const series = LwcPlugin.createStackedBarsSeries(chart, {
		stackOrder: 'reverse', priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(Array.from({ length: 12 }, (_, i) => ({ time: 1704067200 + i * 86400, values: [10, -20] })));
	chart.timeScale().fitContent();
}
