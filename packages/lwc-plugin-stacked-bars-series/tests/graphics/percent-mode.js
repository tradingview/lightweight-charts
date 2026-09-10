function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		res.push({
			time: time.getTime() / 1000,
			// Totals vary a lot; in percent mode every column is the same height
			// and only the shares change.
			values: [
				(10 + (i % 5)) * (1 + (i % 9)),
				(5 + (i % 7) * 2) * (1 + (i % 9)),
				(3 + (i % 4) * 3) * (1 + (i % 9)),
			],
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
	const series = LwcPlugin.createStackedBarsSeries(chart, {
		percent: true,
		autoscaleInfoProvider: () => ({
			priceRange: { minValue: 0, maxValue: 100 },
		}),
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
