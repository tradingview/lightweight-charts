// A pinned X range far wider than the data: the points sit in the first
// slots, and the axis still spans 0–100 exactly from edge to edge.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		xRange: { min: 0, max: 100 },
		plotBorder: { visible: true },
		pointSize: 12,
	});
	series.setData([{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 4 }]);
}
