// Long X labels on a 300 px chart: a PnL axis from −1,000.00 K to
// 1,500.00 K. The labels thin out to steps of 1,000.00 K — three of them —
// with the first pushed inside the left end clear of the next.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { width: 300, height: 320, layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		pointSize: 12,
		xFormatter: x => `${(x / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K`,
	});
	series.setData([{ x: -830000, y: 1 }, { x: 1210000, y: 2 }, { x: 200000, y: 1.5 }, { x: -300000, y: 1.2 }]);
}
