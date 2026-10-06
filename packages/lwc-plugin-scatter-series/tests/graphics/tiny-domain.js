// A tiny domain, 0–0.05 on both axes: the ticks and the labels keep enough
// decimals and the slots do not drift.

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
	const series = LwcPlugin.createScatterSeries(chart, { priceFormat: { type: 'price', precision: 3, minMove: 0.001 } });
	const random = seededRandom(14);
	const points = [];
	for (let i = 0; i < 80; i++) {
		points.push({ x: random() * 0.05, y: random() * 0.05 });
	}
	points.push({ x: 0, y: 0 }, { x: 0.05, y: 0.05 });
	series.setData(points);
}
