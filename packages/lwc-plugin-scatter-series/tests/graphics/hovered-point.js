// A point highlighted from outside the chart with setHoveredPoint: drawn on
// top of its neighbours at hoveredOpacity.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { opacity: 0.3, pointSize: 30, color: '#2962FF' });
	const points = [];
	for (let i = 0; i < 7; i++) {
		points.push({ id: `p${i}`, x: 40 + i * 2, y: 50 + (i % 2) * 3 });
	}
	points.push({ id: 'low', x: 0, y: 0 }, { id: 'high', x: 100, y: 100 });
	series.setData(points);
	series.setHoveredPoint('p3');
}
