// The design limit: ten groups of 500 points, 5000 in total, sized by value.

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
	const series = LwcPlugin.createScatterSeries(chart, { sizeRange: { min: 5, max: 12 }, opacity: 0.5 });
	const random = seededRandom(15);
	const points = [];
	for (let g = 0; g < 10; g++) {
		const cx = 10 + random() * 80;
		const cy = 10 + random() * 80;
		for (let i = 0; i < 500; i++) {
			points.push({ group: `g${g}`, x: cx + (random() - 0.5) * 30, y: cy + (random() - 0.5) * 30, sizeValue: random() });
		}
	}
	series.setData(points);
}
