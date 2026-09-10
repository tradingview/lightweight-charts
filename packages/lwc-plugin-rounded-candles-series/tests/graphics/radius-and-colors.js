function generateCandleData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let close = 100;
	for (let i = 0; i < 20; ++i) {
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

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
		// Wide bars, so the rounding is visible next to the default case.
		timeScale: { barSpacing: 28 },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {
		// A fixed, deliberately large radius: bodies become pill shaped.
		radius: function () {
			return 10;
		},
		upColor: '#7B1FA2',
		downColor: '#FBC02D',
		wickUpColor: '#4A148C',
		wickDownColor: '#F57F17',
	});
	series.setData(generateCandleData());
}
