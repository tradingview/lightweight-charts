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

// The candle data sits two years to the left of a second series, and the view
// is put over that second series, so the candle series' visible range is
// non-null but empty. The renderer used to read `bars[from]` and throw; the
// pane must simply come up without candles. `scrollToPosition` and a logical
// range outside the data are both clamped, so a second series is what makes the
// range empty.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateCandleData();
	const series = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries());
	series.setData(data);

	const later = chart.addSeries(LightweightCharts.LineSeries);
	later.setData(
		data.map((point, index) => ({
			time: point.time + 86400 * 730,
			value: 100 + index,
		}))
	);

	chart.timeScale().setVisibleLogicalRange({ from: 70, to: 110 });
}
