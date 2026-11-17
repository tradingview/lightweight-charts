function generateData(count = 60, center = 100) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		res.push({ time: time.getTime() / 1000, value: center + Math.sin(i / 6) * 10 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The line options style the lines the plugin adds: a solid 3 px red line
// with no price label on the scale.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	const lines = new LwcPlugin.UserPriceLines({
		lineColor: '#F23645',
		lineWidth: 3,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: false,
	});
	series.attachPrimitive(lines);
	[96, 104].forEach(price => lines.addLine(price));
	chart.timeScale().fitContent();
}
