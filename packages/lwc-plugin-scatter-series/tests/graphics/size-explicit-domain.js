// An explicit size domain of 0–200 with values 0–100: the largest point is
// drawn halfway along the 5–45 px range, and values beyond the domain are
// clamped to its ends.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { sizeRange: { min: 5, max: 45 }, sizeDomain: { min: 0, max: 200 }, opacity: 0.5 });
	const points = [];
	for (let i = 0; i <= 10; i++) {
		points.push({ x: i, y: 1, sizeValue: i * 10 });
		points.push({ x: i, y: 2, sizeValue: i * 40 - 100 });
	}
	series.setData(points);
}
