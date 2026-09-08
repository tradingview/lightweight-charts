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

// The two up/down modes on the same data: `openClose` (pane 0, the default,
// matching the built-in series) and `previousClose` (pane 1, the behaviour of
// the plugin before 1.0.0). Individual bars differ between the panes.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateCandleData();

	const openClose = chart.addCustomSeries(new LwcPlugin.RoundedCandleSeries(), {
		upDownMode: 'openClose',
	});
	openClose.setData(data);

	const previousClose = chart.addCustomSeries(
		new LwcPlugin.RoundedCandleSeries(),
		{ upDownMode: 'previousClose' },
		1
	);
	previousClose.setData(data);

	chart.timeScale().fitContent();
}
