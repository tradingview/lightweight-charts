// The price scale takes in the lowest and the highest edge of the drawn cells:
// a cell given high edge first counts by both of its edges, and cells with an
// edge or an amount that is not finite, or that are null, are left out
// instead of stretching the scale to infinity.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		rightPriceScale: { scaleMargins: { top: 0, bottom: 0 } },
	});
	const series = LwcPlugin.createHeatmapSeries(chart);
	const times = Array.from({ length: 6 }, (_, i) => 1704067200 + i * 86400);
	series.setData(times.map(time => ({
		time,
		cells: [
			{ low: 10, high: 20, amount: 5 },
			{ low: 70, high: 60, amount: 5 },
			{ low: Infinity, high: 5, amount: 5 },
			{ low: -100, high: -90, amount: NaN },
			null,
		],
	})));
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const range = series.priceScale().getVisibleRange();
	if (range === null || Math.abs(range.from - 10) > 0.5 || Math.abs(range.to - 70) > 0.5) {
		throw new Error(`Expected the price scale to span 10 to 70, got ${JSON.stringify(range)}`);
	}
}
