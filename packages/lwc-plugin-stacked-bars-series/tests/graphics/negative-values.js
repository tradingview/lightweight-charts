function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		res.push({
			time: time.getTime() / 1000,
			values: [10 + (i % 5), -(4 + (i % 3)), 3 + (i % 4)],
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { minBarSpacing: 3 },
	}));
	// Values are stacked arithmetically; the series is designed for
	// non-negative parts of a whole, so a negative segment overlaps the ones
	// below it. This case documents that current behaviour.
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
