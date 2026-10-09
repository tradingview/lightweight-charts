// An inverted price scale: larger Y further down. A path joined by lines climbs
// from Y = −40 to 80 in data order, so it runs downwards to its head (the last,
// bigger point) at the bottom right; the baseline at Y = 0 and the cloud of
// points on both sides of it are flipped with it.

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
			{ id: 'cloud', color: '#787B86' },
			{ id: 'path', color: '#2962FF', lineVisible: true, lineWidth: 2, pointSize: 8 },
		],
		baselines: [{ axis: 'y', value: 0, color: '#F23645', width: 2 }],
	});
	series.series().priceScale().applyOptions({ invertScale: true });
	const random = seededRandom(9);
	const points = [];
	for (let i = 0; i < 40; i++) {
		points.push({ group: 'cloud', x: Math.round(random() * 1000) / 10, y: Math.round((random() - 0.5) * 100) });
	}
	for (let i = 0; i < 12; i++) {
		const y = -40 + (120 * i) / 11 + (random() - 0.5) * 8;
		points.push({ group: 'path', x: 5 + i * 8, y: Math.round(y * 10) / 10, size: i === 11 ? 16 : undefined });
	}
	series.setData(points);
}
