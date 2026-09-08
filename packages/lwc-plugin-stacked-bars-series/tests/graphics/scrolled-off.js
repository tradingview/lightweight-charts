function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		res.push({
			time: time.getTime() / 1000,
			values: [10 + (i % 5), 5 + (i % 3) * 2, 3 + (i % 4)],
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
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {});
	series.setData(generateData());

	// Scroll the visible range far past the data so no bars are visible.
	chart.timeScale().scrollToPosition(500, false);
}
