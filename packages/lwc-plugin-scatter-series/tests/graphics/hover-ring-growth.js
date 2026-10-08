// Hover styling: a point highlighted with setHoveredPoint grows by
// hoveredSizeIncrease and gets a ring hoveredRingGap pixels outside it, drawn
// opaque on top of the translucent neighbours it overlaps. Top: a circle, its
// ring in the point's colour. Bottom: a triangle among squares and diamonds,
// the ring following its shape in hoveredRingColor.

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const half = top => {
		const element = document.createElement('div');
		element.style.cssText = `position: absolute; left: 0; top: ${top}px; width: 600px; height: 300px;`;
		container.appendChild(element);
		return element;
	};

	const circles = (window.chart = LwcPlugin.createScatterChart(half(0), { layout: { attributionLogo: false } }));
	const circleSeries = LwcPlugin.createScatterSeries(circles, {
		pointSize: 26,
		opacity: 0.5,
		hoveredSizeIncrease: 10,
		hoveredRingWidth: 3,
		hoveredRingGap: 3,
		groups: [{ id: 'others', color: '#2962FF' }, { id: 'picked', color: '#FF9800' }],
	});
	const cluster = [];
	for (let i = 0; i < 9; i++) {
		cluster.push({ id: `c${i}`, group: 'others', x: 46 + (i % 3) * 4, y: 42 + Math.floor(i / 3) * 8 });
	}
	cluster[4] = { id: 'hovered', group: 'picked', x: 50, y: 50 };
	circleSeries.setData([...cluster, { id: 'low', group: 'others', x: 0, y: 0 }, { id: 'high', group: 'others', x: 100, y: 100 }]);
	circleSeries.setHoveredPoint('hovered');

	const shapes = LwcPlugin.createScatterChart(half(300), { layout: { attributionLogo: false } });
	const shapeSeries = LwcPlugin.createScatterSeries(shapes, {
		pointSize: 24,
		opacity: 0.6,
		hoveredSizeIncrease: 8,
		hoveredRingWidth: 2,
		hoveredRingGap: 2,
		hoveredRingColor: '#131722',
		groups: [
			{ id: 'squares', color: '#089981', shape: 'square' },
			{ id: 'diamonds', color: '#9C27B0', shape: 'diamond' },
			{ id: 'triangles', color: '#F23645', shape: 'triangleUp' },
		],
	});
	shapeSeries.setData([
		{ id: 's1', group: 'squares', x: 47, y: 46 },
		{ id: 's2', group: 'squares', x: 53, y: 55 },
		{ id: 'd1', group: 'diamonds', x: 47, y: 55 },
		{ id: 'd2', group: 'diamonds', x: 53, y: 45 },
		{ id: 'hovered', group: 'triangles', x: 50, y: 50 },
		{ id: 't1', group: 'triangles', x: 56, y: 50 },
		{ id: 'low', group: 'squares', x: 0, y: 0 },
		{ id: 'high', group: 'diamonds', x: 100, y: 100 },
	]);
	shapeSeries.setHoveredPoint('hovered');
}
