// A vertical baseline at MAE = 45, under the points.

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

// Trades: maximum adverse excursion 0–90 on X, PnL on Y, holding time as sizeValue.
function trades(seed, count) {
	const random = seededRandom(seed);
	const result = [];
	for (let i = 0; i < count; i++) {
		const x = Math.round(random() * 890) / 10;
		const y = Math.round((random() - 0.45) * 2000) * 500;
		result.push({ id: `t${i}`, x, y, sizeValue: Math.round(1 + random() * random() * 60) });
	}
	return result;
}

function runTestCase(container) {
	// No pointer: a point under it would be highlighted.
	window.ignoreMouseMove = true;
	const chart = (window.chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } }));
	const series = LwcPlugin.createScatterSeries(chart, { baselines: [{ axis: 'x', value: 45 }], sizeRange: { min: 5, max: 20 }, priceFormat: { type: 'custom', minMove: 1000, formatter: price => `${(price / 1000).toFixed(0)} K` } });
	series.setData(trades(7, 120));
}
