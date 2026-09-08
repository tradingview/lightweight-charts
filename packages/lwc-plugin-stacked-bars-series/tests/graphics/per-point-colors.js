function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 20; ++i) {
		const point = {
			time: time.getTime() / 1000,
			values: [10 + (i % 5), 5 + (i % 3) * 2, 3 + (i % 4)],
		};
		if (i % 4 === 0) {
			// Highlight every fourth point: the middle segment keeps the
			// series colour, the other two are overridden.
			point.colors = ['#111111', undefined, '#BBBBBB'];
		}
		res.push(point);
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { minBarSpacing: 3 },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
