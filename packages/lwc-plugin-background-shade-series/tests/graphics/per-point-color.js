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

// A color on a data item shades that bar with it, whatever its value.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart);
	shade.setData(generateData().map((point, index) => (index % 10 === 0 ? { ...point, color: '#131722' } : point)));
	chart.timeScale().fitContent();
}
