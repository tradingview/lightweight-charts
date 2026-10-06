// An X axis from −0.4 to 0.8 on a 300 px chart: the labels thin out to a
// nice step that still gives several of them, the end ones pushed inside.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { width: 300, height: 320, layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { pointSize: 12 });
	series.setData([{ x: -0.33, y: 1 }, { x: 0.71, y: 2 }, { x: 0.1, y: 1.5 }, { x: 0.45, y: 1.2 }, { x: -0.1, y: 1.8 }]);
}
