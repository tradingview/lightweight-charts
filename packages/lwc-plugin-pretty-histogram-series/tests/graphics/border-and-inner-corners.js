function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 24; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: Math.sin(i / 4) * 25,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createPrettyHistogramSeries(chart, {
		color: '#BBDEFB',
		borderColor: '#1565C0',
		borderWidth: 2,
		radius: 8,
		roundInnerCorners: true,
		widthPercent: 60,
		minColumnWidth: 12,
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
