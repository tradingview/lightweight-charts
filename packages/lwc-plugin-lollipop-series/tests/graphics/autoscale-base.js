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

// Every value is far above a base of 50, and the base is part of the
// autoscale range from the first setData: the stems reach down to 50. The
// plain class would scale the first data with the default base of 0 instead.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 12 },
	}));
	const series = LwcPlugin.createLollipopSeries(chart, { base: 50 });
	series.setData(generateData(40, 100, 10));
	chart.timeScale().fitContent();
}
