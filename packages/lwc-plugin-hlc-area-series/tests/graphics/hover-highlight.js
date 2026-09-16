function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let close = 100;
	for (let i = 0; i < 60; ++i) {
		close += Math.sin(i / 5) * 1.5;
		const high = close + 3 + Math.abs(Math.cos(i / 4)) * 2;
		const low = close - 3 - Math.abs(Math.sin(i / 7)) * 2;
		res.push({ time: time.getTime() / 1000, high, low, close });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// `hoverPointRadius`: the screenshoter leaves the pointer in the middle of the
// pane, so the bar under it gets a dot on its high, close and low. The band is
// stretched over the whole pane height so the pointer is always inside it.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries(), {
		hoverPointRadius: 6,
	});
	series.setData(
		generateData().map(point => ({
			time: point.time,
			high: 110,
			low: 90,
			close: 100 + (point.close - 100) / 4,
		}))
	);
	chart.timeScale().fitContent();
}
