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

// Gradient pairs on both fills: each band fades from its top stop at the top of
// the pane to its bottom stop at the bottom.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries(), {
		highAreaTopColor: 'rgba(4, 153, 129, 0.8)',
		highAreaBottomColor: 'rgba(4, 153, 129, 0.05)',
		lowAreaTopColor: 'rgba(242, 54, 69, 0.05)',
		lowAreaBottomColor: 'rgba(242, 54, 69, 0.8)',
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
