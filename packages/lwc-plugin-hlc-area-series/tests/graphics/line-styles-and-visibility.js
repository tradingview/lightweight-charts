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

// Per-line `lineStyle` (pane 0: dashed high, dotted low, large-dashed close)
// and the visibility switches (pane 1: no close line and no fills, so only the
// high and low lines remain).
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const data = generateData();

	const styled = chart.addCustomSeries(new LwcPlugin.HLCAreaSeries(), {
		highLineStyle: LightweightCharts.LineStyle.Dashed,
		lowLineStyle: LightweightCharts.LineStyle.Dotted,
		closeLineStyle: LightweightCharts.LineStyle.LargeDashed,
	});
	styled.setData(data);

	const bare = chart.addCustomSeries(
		new LwcPlugin.HLCAreaSeries(),
		{ closeLineVisible: false, areaVisible: false },
		1
	);
	bare.setData(data);

	chart.timeScale().fitContent();
}
