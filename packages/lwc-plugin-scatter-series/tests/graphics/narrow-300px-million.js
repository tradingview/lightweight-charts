// Seven-digit X labels on a 300 px chart (0 to 1,000,000): the labels thin
// out to steps of 500,000 rather than keeping only the two ends.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { width: 300, height: 320, layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 12 });
	series.setData([{ x: 0, y: 1 }, { x: 1e6, y: 2 }, { x: 420000, y: 1.5 }, { x: 760000, y: 1.2 }]);
}
