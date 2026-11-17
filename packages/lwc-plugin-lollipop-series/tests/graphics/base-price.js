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

// A base of 250 in the middle of values from 200 to 300: the stems run up to
// the values above it and down to the ones below it, and the scale is fitted
// to the values, not stretched down to zero.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 12 },
	}));
	const series = LwcPlugin.createLollipopSeries(chart, { base: 250 });
	series.setData(generateData(40, 250, 50));
	chart.timeScale().fitContent();
}
