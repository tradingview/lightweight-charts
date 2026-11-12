function generateData(count = 30, rows = 10, rowHeight = 10) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const cells = [];
		for (let r = 0; r < rows; ++r) {
			const amount = Math.round(50 + Math.sin(i / 4 + r / 2) * 40 + Math.cos(i * 1.3 + r) * 10);
			cells.push({ low: r * rowHeight, high: (r + 1) * rowHeight, amount });
		}
		res.push({ time: time.getTime() / 1000, cells });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Only a run of whitespace is in view, so the series has no point to draw and
// its visible range is empty; nothing is drawn and nothing throws.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createHeatmapSeries(chart);
	series.setData(generateData(200).map((point, index) => (index >= 20 && index < 180 ? { time: point.time } : point)));
	chart.timeScale().setVisibleLogicalRange({ from: 80, to: 120 });
}
