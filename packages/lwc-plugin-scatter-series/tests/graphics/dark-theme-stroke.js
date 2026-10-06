// A dark theme: the ring around every point takes the chart background by
// default, so overlapping points are parted by a dark ring, not a white one.

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
	const chart = (window.chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false, background: { color: '#131722' }, textColor: '#D1D4DC' },
		grid: { vertLines: { color: '#2A2E39' }, horzLines: { color: '#2A2E39' } },
	}));
	const series = LwcPlugin.createScatterSeries(chart, { opacity: 0.8, sizeRange: { min: 10, max: 40 } });
	const random = seededRandom(9);
	const points = [];
	for (let i = 0; i < 40; i++) {
		points.push({ x: random() * 10, y: random() * 10, sizeValue: random() });
	}
	series.setData(points);
}
