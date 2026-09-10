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
	// Negative values stack downwards from the base: the second segment is
	// drawn back down from the top of the first, the third continues up from
	// there, and the autoscale covers the whole run rather than just the total.
	const series = LwcPlugin.createStackedBarsSeries(chart, {});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
