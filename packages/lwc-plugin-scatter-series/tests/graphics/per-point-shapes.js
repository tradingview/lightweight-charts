// Per-point shapes beat the group's and the series': one group of circles
// with every fifth point a square, a diamond, a triangle up or down, and a
// group of diamonds with circle points among them.

// A seeded generator (mulberry32), so that both screenshots draw the same data.
function seededRandom(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), state | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, {
		pointSize: 16,
		opacity: 0.8,
		groups: [
			{ id: 'circles', color: '#2962FF' },
			{ id: 'diamonds', color: '#FF9800', shape: 'diamond' },
		],
	});
	const shapes = ['square', 'diamond', 'triangleUp', 'triangleDown'];
	const random = seededRandom(9);
	const points = [];
	for (let i = 0; i < 40; i++) {
		const point = { group: 'circles', x: random() * 100, y: random() * 50 };
		if (i % 5 === 0) {
			point.shape = shapes[(i / 5) % shapes.length];
		}
		points.push(point);
	}
	for (let i = 0; i < 20; i++) {
		const point = { group: 'diamonds', x: random() * 100, y: 50 + random() * 50 };
		if (i % 4 === 0) {
			point.shape = 'circle';
		}
		points.push(point);
	}
	series.setData(points);
}
