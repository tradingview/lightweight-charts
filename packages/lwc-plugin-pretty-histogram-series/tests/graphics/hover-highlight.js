function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 10 + Math.abs(Math.sin(i / 6)) * 20,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The screenshoter leaves the pointer in the middle of the viewport, so one
// column is hovered: with `highlightHovered` every other column is faded.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createPrettyHistogramSeries(chart, {
		highlightHovered: true,
		widthPercent: 80,
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
