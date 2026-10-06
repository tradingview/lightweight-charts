// Per-point overrides beat the group: colour, opacity and size of single
// points. A point of an undeclared group gets the next palette colour.

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
		groups: [
			{ id: 'aaa', name: 'AAA-AA', color: '#089981' },
			{ id: 'bbb', name: 'A-BBB', color: '#2962FF', opacity: 0.4 },
		],
		sizeRange: { min: 5, max: 30 },
		sizeScale: 'area',
	});
	const random = seededRandom(5);
	const points = [];
	for (let i = 0; i < 30; i++) {
		const x = 1 + random() * 28;
		points.push({ id: `a${i}`, group: 'aaa', x, y: 2 + x / 10 + random(), sizeValue: random() * 100 });
		points.push({ id: `b${i}`, group: 'bbb', x: 1 + random() * 28, y: 5 + random() * 2, sizeValue: random() * 100 });
	}
	points[10] = { ...points[10], color: '#F23645', opacity: 1, size: 24 };
	points[11] = { ...points[11], opacity: 1 };
	points[20] = { ...points[20], size: 50 };
	points.push({ id: 'undeclared', group: 'other', x: 15, y: 8, size: 20 });
	series.setData(points);
}
