// Consecutive conflated bars have logical stride > 1.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container, {
		timeScale: { enableConflation: true, minBarSpacing: 0.1, barSpacing: 0.1 },
	});
	const series = LwcPlugin.createHLCAreaSeries(chart, {
		priceLineVisible: false, lastValueVisible: false,
		highLineVisible: false, lowLineVisible: false, closeLineVisible: false,
		highAreaColor: '#00ff00', lowAreaColor: '#00ff00',
	});
	series.setData(Array.from({ length: 8512 }, (_, i) => i >= 4000 && i < 4512
		? { time: 1704067200 + i * 86400 }
		: { time: 1704067200 + i * 86400, high: 30, close: 20, low: 10 }));
	chart.timeScale().fitContent();
}
