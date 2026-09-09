// High/low screen coordinates reverse on invertScale.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = LightweightCharts.createChart(container, { rightPriceScale: { invertScale: true } });
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {
		wickColor: '#00ff00', upColor: '#444444', downColor: '#444444',
		borderVisible: false, priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(Array.from({ length: 8 }, (_, i) => ({ time: 1704067200 + i * 86400, open: 30, high: 60, low: 10, close: 40 })));
	chart.timeScale().fitContent();
}
