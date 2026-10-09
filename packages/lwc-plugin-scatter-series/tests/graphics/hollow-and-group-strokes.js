// Hollow markers and strokes per group and per point: an open group outlined
// in its colour (2 px), a filled group with a dark 3 px ring, a series-wide
// hollow default overridden by a filled group, and single points overriding
// the stroke colour, the width and hollowness.

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
		hollow: true,
		opacity: 0.9,
		pointSize: 18,
		shape: 'square',
		groups: [
			{ id: 'open', color: '#089981', strokeWidth: 2, shape: 'circle' },
			{ id: 'ringed', color: '#2962FF', hollow: false, strokeColor: '#131722', strokeWidth: 3 },
			{ id: 'filled', color: '#FF9800', hollow: false, shape: 'triangleUp' },
		],
	});
	const random = seededRandom(4);
	const points = [];
	['open', 'ringed', 'filled'].forEach((group, index) => {
		for (let i = 0; i < 12; i++) {
			points.push({ group, x: random() * 100, y: index * 30 + random() * 25 });
		}
	});
	// Ungrouped points take the series' hollow squares.
	for (let i = 0; i < 6; i++) {
		points.push({ x: random() * 100, y: 95 + random() * 10, color: '#AA00FF' });
	}
	points[0] = { ...points[0], hollow: false, strokeColor: '#F23645', strokeWidth: 4, size: 26 };
	points[13] = { ...points[13], hollow: true, strokeWidth: 1 };
	points[25] = { ...points[25], strokeColor: null, strokeWidth: 0 };
	series.setData(points);
}
