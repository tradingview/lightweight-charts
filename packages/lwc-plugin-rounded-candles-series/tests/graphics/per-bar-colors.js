function generateCandleData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let close = 100;
	for (let i = 0; i < 60; ++i) {
		// A deterministic gap between the previous close and this open, so that
		// `close >= open` and `close >= previous close` disagree on some bars.
		const open = close + Math.sin(i / 2.5) * 6;
		close = 100 + Math.sin(i / 7) * 12 + Math.cos(i / 3) * 4;
		const high = Math.max(open, close) + 2 + Math.abs(Math.sin(i / 5)) * 3;
		const low = Math.min(open, close) - 2 - Math.abs(Math.cos(i / 4)) * 3;
		res.push({ time: time.getTime() / 1000, open, high, low, close });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Per-point `color` / `borderColor` / `wickColor` fields on the data. Every
// fifth bar is black in all three, exactly as the built-in candlestick series
// resolves its per-item overrides.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries());
	series.setData(generateCandleData().map((point, index) => {
		if (index % 5 !== 0) {
			return point;
		}
		return Object.assign({}, point, {
			color: '#000000',
			borderColor: '#000000',
			wickColor: '#000000',
		});
	}));
	chart.timeScale().fitContent();
}
