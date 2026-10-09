// Baselines on both axes: a solid one at Y = 0, a dashed one at X = 45 and a 2
// px dotted coloured one at Y = 400 K.

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
	const series = LwcPlugin.createScatterSeries(chart, {
		baselines: [
			{ axis: 'y', value: 0 },
			{ axis: 'x', value: 45, style: LightweightCharts.LineStyle.Dashed },
			{ axis: 'y', value: 400000, color: '#F23645', width: 2, style: LightweightCharts.LineStyle.Dotted },
		],
		sizeRange: { min: 5, max: 20 },
		priceFormat: { type: 'custom', minMove: 1000, formatter: price => `${(price / 1000).toFixed(0)} K` },
	});
	series.setData(trades(7, 120));
}
