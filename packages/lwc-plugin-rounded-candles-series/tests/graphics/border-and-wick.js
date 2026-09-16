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

// Borders and wicks: a contrasting border colour on both directions, and wicks
// with rounded ends.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
		timeScale: { barSpacing: 18 },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {
		upColor: 'rgba(38, 166, 154, 0.35)',
		downColor: 'rgba(239, 83, 80, 0.35)',
		borderVisible: true,
		borderUpColor: '#00695C',
		borderDownColor: '#B71C1C',
		wickColor: '#212121',
		wickLineCap: 'round',
		radius: 6,
	});
	series.setData(generateCandleData());
}
