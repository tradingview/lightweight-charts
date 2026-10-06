// Long X labels on a 300 px chart whose price scale is as wide: no nice step
// fits two labels side by side, so the two ends of the axis are labelled —
// -1,000.00 K at the left edge and 1,500.00 K at the right one.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const thousands = value => `${(value / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { width: 300, height: 320, layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		pointSize: 12,
		xFormatter: thousands,
		priceFormat: { type: 'custom', minMove: 1000, formatter: thousands },
	});
	series.setData([{ x: -830000, y: -1400000 }, { x: 1210000, y: 1450000 }, { x: 200000, y: 300000 }]);
}
