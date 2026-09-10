function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 20; ++i) {
		res.push({
			time: time.getTime() / 1000,
			values: [10 + (i % 5), -(4 + (i % 3))],
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
	// Columns stacked from 50 rather than 0. `priceValueBuilder` measures from
	// zero, so a non-zero base needs an autoscale provider of its own.
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {
		base: 50,
		autoscaleInfoProvider: () => ({
			priceRange: { minValue: 40, maxValue: 70 },
		}),
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
