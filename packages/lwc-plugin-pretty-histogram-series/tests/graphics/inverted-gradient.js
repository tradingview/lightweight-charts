function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { rightPriceScale: { invertScale: true } });
	const series = LwcPlugin.createPrettyHistogramSeries(chart, {
		base: 0, color: '#ef5350', gradientColor: '#2962ff', radius: 20,
		widthPercent: 65, priceLineVisible: false, lastValueVisible: false,
	});
	series.setData([-30, -10, 10, 30].map((value, i) => ({ time: 1704067200 + i * 86400, value })));
	chart.timeScale().fitContent();
}
