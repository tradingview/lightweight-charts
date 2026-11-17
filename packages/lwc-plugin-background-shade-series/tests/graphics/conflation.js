function generateData(count = 60, low = 0, high = 100) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const ratio = (Math.sin(i / 6) + 1) / 2;
		res.push({ time: time.getTime() / 1000, value: Math.round((low + ratio * (high - low)) * 100) / 100 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Thousands of bars conflated: each conflated column covers the slots of the
// bars it stands for, so the shading still has no gaps.
function runTestCase(container) {
	window.ignoreMouseMove = true;
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { enableConflation: true, minBarSpacing: 0.1, barSpacing: 0.1 },
	}));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { opacity: 1 });
	shade.setData(generateData(8000));
	chart.timeScale().fitContent();
}
