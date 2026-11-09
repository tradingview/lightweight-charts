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

// Narrow bars: a 3 px spacing caps the stem width at 1.5 px and the dot at
// 3 px across, so neighboring dots touch but never overlap however large the
// options are.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 3, minBarSpacing: 3 },
	}));
	const series = LwcPlugin.createLollipopSeries(chart, { lineWidth: 6, markerSize: 20 });
	series.setData(generateData(200));
}
