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

// Every fifth bar names a color the canvas does not accept: those bars are
// shaded from their values like the rest, instead of repeating the shade of
// the bar before them.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { opacity: 1 });
	shade.setData(generateData().map((point, index) => (index % 5 === 0 ? { ...point, color: 'not-a-color' } : point)));
	chart.timeScale().fitContent();
}
