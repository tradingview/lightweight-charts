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

function lineData(shade) {
	return shade.map((point, index) => ({ time: point.time, value: 100 + Math.sin(index / 3) * 10 }));
}

// Values from -50 to 150 against a 0–100 range: everything beyond the range
// gets the end color, rather than a broken one.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart);
	shade.setData(generateData(60, -50, 150));
	chart.addSeries(LightweightCharts.LineSeries, { color: '#131722' }).setData(lineData(generateData()));
	chart.timeScale().fitContent();
}
