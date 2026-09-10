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

// `hoverDimOpacity`: the screenshoter leaves the pointer in the middle of the
// pane, so the candle under it stays opaque while the rest of the series is
// dimmed. Every candle spans the same high/low band, so the pointer is inside
// one of them wherever the pane is scaled to.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0, bottom: 0 } },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {
		hoverDimOpacity: 0.2,
	});
	series.setData(generateCandleData().map(point => {
		return {
			time: point.time,
			open: point.open > point.close ? 103 : 97,
			high: 110,
			low: 90,
			close: point.open > point.close ? 97 : 103,
		};
	}));
	chart.timeScale().fitContent();
}
