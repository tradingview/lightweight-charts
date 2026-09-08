function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		// A gap of whitespace rows in the middle: a plain { time } entry with
		// no values.
		if (i >= 15 && i < 20) {
			res.push({ time: time.getTime() / 1000 });
		} else {
			res.push({
				time: time.getTime() / 1000,
				values: [10 + (i % 5), 5 + (i % 3) * 2, 3 + (i % 4)],
			});
		}
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
