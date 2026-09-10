// Consecutive conflated bars have logical stride > 1.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container, {
		timeScale: { enableConflation: true, minBarSpacing: 0.1, barSpacing: 0.1 },
	});
	const paneView = new LwcPlugin.HLCAreaSeries();
	const series = chart.addCustomSeries(paneView, {
		priceLineVisible: false, lastValueVisible: false,
		highLineVisible: false, lowLineVisible: false, closeLineVisible: false,
		highAreaColor: '#00ff00', lowAreaColor: '#00ff00',
	});
	series.setData(Array.from({ length: 8000 }, (_, i) => ({ time: 1704067200 + i * 86400, high: 30, close: 20, low: 10 })));
	chart.timeScale().fitContent();
}
