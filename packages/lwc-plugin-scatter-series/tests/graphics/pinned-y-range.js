// A pinned Y range of 0–12 %: its ends sit at the scale margins, with no extra
// room for the points; points beyond it reach into the margins and are cut off
// at the plot edges.

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
		yRange: { min: 0, max: 12 },
		pointSize: 16,
		priceFormat: { type: 'custom', minMove: 0.01, formatter: price => `${Number(price.toFixed(2))}%` },
	});
	const random = seededRandom(10);
	const points = [];
	for (let i = 0; i < 80; i++) {
		points.push({ x: random() * 30, y: -2 + random() * 16 });
	}
	points.push({ x: 15, y: 12 }, { x: 15, y: 0 });
	series.setData(points);
}
