function generateData(count = 60, center = 100) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		res.push({ time: time.getTime() / 1000, value: center + Math.sin(i / 6) * 10 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Three price lines added through the plugin, in its default dashed black,
// and no pointer near the edge: no button is drawn.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	const lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	[94, 100, 107.5].forEach(price => lines.addLine(price));
	chart.timeScale().fitContent();
}
