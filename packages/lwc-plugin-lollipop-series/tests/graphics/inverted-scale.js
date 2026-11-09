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

// With an inverted price scale the stems still join the base to the values,
// now running the other way.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 12 },
	}));
	const series = LwcPlugin.createLollipopSeries(chart);
	series.priceScale().applyOptions({ invertScale: true });
	series.setData(generateData());
	chart.timeScale().fitContent();
}
