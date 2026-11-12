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

// Options a JavaScript caller can get wrong: a shader that is not a function
// falls back to the default green, and a negative gap or border width counts
// as 0, so the cells abut with no border instead of overlapping.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 18 },
	}));
	const series = LwcPlugin.createHeatmapSeries(chart, { cellShader: 'red', cellGap: -4, cellBorderWidth: -2, cellBorderColor: '#131722' });
	series.setData(generateData());
	chart.timeScale().fitContent();
}
