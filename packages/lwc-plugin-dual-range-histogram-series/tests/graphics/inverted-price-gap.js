function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { rightPriceScale: { invertScale: true } });
	const series = LwcPlugin.createDualRangeHistogramSeries(chart, {
		scaleMode: 'price', gap: 40, widthPercent: 70,
		borderRadius: { upOuter: 12, upInner: 8, downOuter: 12, downInner: 8 },
		priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(Array.from({ length: 4 }, (_, i) => ({ time: 1704067200 + i * 86400, values: [10 + i, 5, -10 - i, -5] })));
	chart.timeScale().fitContent();
}
