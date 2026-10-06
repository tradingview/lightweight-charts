// Hover styling through setHoveredPoint: the hovered point grows by
// hoveredSizeIncrease and gets a ring hoveredRingGap outside it, in the point
// colour, drawn on top of its neighbours; a hovered square gets a square ring.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		opacity: 0.4,
		pointSize: 24,
		color: '#2962FF',
		hoveredSizeIncrease: 6,
		hoveredRingWidth: 2,
		hoveredRingGap: 2,
		groups: [{ id: 'squares', color: '#089981', shape: 'square' }],
	});
	const points = [];
	for (let i = 0; i < 7; i++) {
		points.push({ id: `p${i}`, x: 30 + i * 2, y: 50 + (i % 2) * 3 });
	}
	points.push({ id: 'sq', group: 'squares', x: 75, y: 25 });
	points.push({ id: 'low', x: 0, y: 0 }, { id: 'high', x: 100, y: 100 });
	series.setData(points);
	series.setHoveredPoint('p3');
}
