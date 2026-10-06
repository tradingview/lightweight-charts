// `xMargins`: the ends of the X domain sit 25 px inside the plot edges, so
// the large bubbles at both ends are drawn whole.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { xMargins: 25, sizeRange: { min: 10, max: 50 } });
	series.setData([
		{ x: 0, y: 1, sizeValue: 10 },
		{ x: 0, y: 3, sizeValue: 4 },
		{ x: 50, y: 2, sizeValue: 6 },
		{ x: 100, y: 3, sizeValue: 10 },
		{ x: 100, y: 1, sizeValue: 1 },
	]);
}
