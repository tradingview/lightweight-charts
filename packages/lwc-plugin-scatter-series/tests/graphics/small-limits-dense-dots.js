// A dense plot of tiny dots: pointSizeLimits of 2–3 px and 4000 points sized
// by value within them. Each dot keeps its colour: its 1 px ring is narrowed
// to a quarter of its size.

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
		pointSizeLimits: { min: 2, max: 3 },
		sizeRange: { min: 2, max: 3 },
		opacity: 0.8,
	});
	const random = seededRandom(31);
	const points = [];
	for (let g = 0; g < 4; g++) {
		const cx = 20 + random() * 60;
		const cy = 20 + random() * 60;
		for (let i = 0; i < 1000; i++) {
			const angle = random() * 2 * Math.PI;
			const distance = Math.sqrt(random()) * 25;
			points.push({ group: `g${g}`, x: cx + Math.cos(angle) * distance, y: cy + Math.sin(angle) * distance, sizeValue: random() });
		}
	}
	series.setData(points);
}
