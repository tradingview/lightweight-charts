// No data: no error, an empty plot over the default 0–10 X axis fitted edge
// to edge, a price scale with labels, and the border and baselines drawn.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		plotBorder: { visible: true },
		baselines: [{ axis: 'y', value: 0 }],
	});
	series.setData([]);
}
