// Every point at the same X: a degenerate X domain widened around the value.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 14 });
	const points = [];
	for (let i = 0; i < 12; i++) {
		points.push({ x: 5, y: i * i });
	}
	series.setData(points);
}
