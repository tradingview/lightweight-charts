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

// A base in the middle of the values: columns run up to the values above it
// and down to the ones below it.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 18 },
	}));
	const series = LwcPlugin.createGroupedBarsSeries(chart, { base: 23 });
	series.setData(generateData());
	chart.timeScale().fitContent();
}
