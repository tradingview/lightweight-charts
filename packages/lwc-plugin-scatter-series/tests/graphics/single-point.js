// A single point: the X domain is widened around it and the point is centred.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 20 });
	series.setData([{ x: 42, y: 7 }]);
}
