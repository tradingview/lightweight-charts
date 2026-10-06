// Only negative values on both axes: the domain is rounded outwards and zero
// is outside it.

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
	const series = LwcPlugin.createScatterSeries(chart, { baselines: [{ axis: 'x', value: -50 }] });
	const random = seededRandom(13);
	const points = [];
	for (let i = 0; i < 80; i++) {
		points.push({ x: -90 + random() * 80, y: -500 + random() * 400, sizeValue: random() });
	}
	series.setData(points);
}
