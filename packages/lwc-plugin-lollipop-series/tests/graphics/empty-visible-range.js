function generateData(count = 40, center = 0, amplitude = 10) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: center + Math.round(Math.sin(i / 4) * amplitude * 100) / 100,
		});
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
	const series = LwcPlugin.createLollipopSeries(chart);
	series.setData(generateData(200).map((point, index) => (index >= 20 && index < 180 ? { time: point.time } : point)));
	chart.timeScale().setVisibleLogicalRange({ from: 80, to: 120 });
}
