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

// null, a value which is not a finite number, and a value equal to the base
// leave their column empty, and the other columns keep their places.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 18 },
	}));
	const series = LwcPlugin.createGroupedBarsSeries(chart);
	series.setData(generateData().map((point, index) => (index % 3 === 0 ? { ...point, values: [point.values[0], index % 6 === 0 ? null : NaN, point.values[2]] } : index % 5 === 0 ? { ...point, values: [0, point.values[1], point.values[2]] } : point)));
	chart.timeScale().fitContent();
}
