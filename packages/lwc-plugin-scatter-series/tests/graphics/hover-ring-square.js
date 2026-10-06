// The hover ring follows the marker's shape at an even distance on every
// side: a hovered square, with a ring of its own colour, and a triangle and
// a diamond beside it that are not hovered.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 0.7,
		pointSize: 30,
		hoveredRingWidth: 3,
		hoveredRingGap: 3,
		hoveredRingColor: '#131722',
		groups: [{ id: 'g', color: '#26C6DA' }],
	});
	series.setData([
		{ id: 'square', group: 'g', x: 30, y: 50, shape: 'square' },
		{ id: 'triangle', group: 'g', x: 50, y: 50, shape: 'triangleUp' },
		{ id: 'diamond', group: 'g', x: 70, y: 50, shape: 'diamond' },
		{ id: 'low', x: 0, y: 0 },
		{ id: 'high', x: 100, y: 100 },
	]);
	series.setHoveredPoint('square');
}
