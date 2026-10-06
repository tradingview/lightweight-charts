// A custom X formatter (maturities in years) on a pinned 0–30 range, with a
// percentage Y format.

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
			{ id: 'aaa', color: '#089981' },
			{ id: 'bbb', color: '#2962FF' },
			{ id: 'hy', color: '#FF9800' },
		],
		xRange: { min: 0, max: 30 },
		yRange: { min: 0, max: 12 },
		xFormatter: x => `${x}Y`,
		sizeRange: { min: 5, max: 30 },
		sizeScale: 'area',
		priceFormat: { type: 'custom', minMove: 0.01, formatter: price => `${Number(price.toFixed(2))}%` },
	});
	const random = seededRandom(12);
	const points = [];
	[['aaa', 2], ['bbb', 4], ['hy', 8]].forEach(([group, base]) => {
		for (let i = 0; i < 20; i++) {
			const x = 1 + random() * 28;
			points.push({ group, x, y: base + x / 15 + random() * 2, sizeValue: random() * 200 });
		}
	});
	series.setData(points);
}
