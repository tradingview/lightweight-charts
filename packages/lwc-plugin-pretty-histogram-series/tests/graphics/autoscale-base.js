function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			// Values far above zero: without the base in the autoscale the
			// columns would be clipped off at the bottom of the pane.
			value: 100 + Math.abs(Math.sin(i / 6)) * 20,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// `priceValueBuilder` reports the base alongside the value, so the zero line
// stays in view without a custom `autoscaleInfoProvider`.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.PrettyHistogramSeries());
	series.setData(generateData());
	chart.timeScale().fitContent();
}
