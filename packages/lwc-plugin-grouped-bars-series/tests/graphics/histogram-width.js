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

// columnWidthMode 'histogram' makes every group as wide as the built-in
// histogram's columns: the whole bar spacing but a one pixel gap.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 18 },
	}));
	const series = LwcPlugin.createGroupedBarsSeries(chart, { columnWidthMode: 'histogram' });
	series.setData(generateData(30));
	chart.timeScale().fitContent();
}
