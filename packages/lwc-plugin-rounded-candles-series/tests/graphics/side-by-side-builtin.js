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

// The same OHLC data on the built-in candlestick series (pane 0) and on the
// rounded candle series (pane 1). Both panes must show the same up/down
// colouring, bar for bar: the plugin decides on `open <= close` like the
// built-in series does.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateCandleData();

	const builtIn = chart.addSeries(LightweightCharts.CandlestickSeries);
	builtIn.setData(data);

	const rounded = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {}, 1);
	rounded.setData(data);

	chart.timeScale().fitContent();
}
