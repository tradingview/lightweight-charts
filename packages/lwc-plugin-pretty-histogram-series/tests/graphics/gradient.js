function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: Math.sin(i / 5) * 25,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The fill fades from the column colour at the base line to `gradientColor` at
// the rounded outer end, upwards and downwards alike.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createPrettyHistogramSeries(chart, {
		color: '#2962FF',
		gradientColor: '#E1EAFF',
		radius: 6,
		widthPercent: 80,
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
