function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		const point = {
			time: time.getTime() / 1000,
			value: 10 + Math.abs(Math.sin(i / 6)) * 20,
		};
		if (i % 5 === 0) {
			point.color = '#F23645';
		} else if (i % 5 === 2) {
			point.color = '#089981';
		}
		res.push(point);
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createPrettyHistogramSeries(chart);
	series.setData(generateData());
	chart.timeScale().fitContent();
}
