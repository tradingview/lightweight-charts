function generateData(count = 30, groups = 3, center = 20, amplitude = 10) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const values = [];
		for (let g = 0; g < groups; ++g) {
			values.push(center + g * 3 + Math.round(Math.sin(i / 4 + g * 1.7) * amplitude * 100) / 100);
		}
		res.push({ time: time.getTime() / 1000, values });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Narrow bars: at a 4 px spacing a group of five columns is 3.2 px wide, too
// narrow for one pixel per column at pixel ratios 1 and 1.25. Every column
// still gets a pixel, where the example drew three of the five: they share
// pixels, the tallest drawn first so that the shorter values stay visible in
// front of them, and nothing is drawn outside the group.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 4, minBarSpacing: 4 },
	}));
	const series = LwcPlugin.createGroupedBarsSeries(chart);
	series.setData(generateData(120, 5));
}
