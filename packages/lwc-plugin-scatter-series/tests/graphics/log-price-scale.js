// A logarithmic price scale: Y grows tenfold every 25 units of X, from about
// 0.5 to 6 000, so the points lie along a straight band across four decades,
// with dynamic sizes and a dashed baseline at Y = 1 000.

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
	const chart = (window.chart = LwcPlugin.createScatterChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { mode: LightweightCharts.PriceScaleMode.Logarithmic },
	}));
	const series = LwcPlugin.createScatterSeries(chart, {
		sizeRange: { min: 5, max: 24 },
		baselines: [{ axis: 'y', value: 1000, style: LightweightCharts.LineStyle.Dashed }],
	});
	const random = seededRandom(5);
	const points = [];
	for (let i = 0; i < 100; i++) {
		const x = Math.round(random() * 1000) / 10;
		const y = Math.pow(10, x / 25 - 0.5 + random() * 0.6);
		points.push({ x, y: Math.round(y * 100) / 100, sizeValue: Math.round(1 + random() * 99) });
	}
	series.setData(points);
}
