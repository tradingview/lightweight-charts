function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 10 + Math.abs(Math.sin(i / 6)) * 20,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The data is scrolled out of view. The library clamps the scroll, so a
// couple of bars are left at the edge; together with the null/empty visible
// range guards in the renderer, nothing is drawn off the data and nothing
// throws. `scrollToPosition` clamps harder, so the range is set directly.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createPrettyHistogramSeries(chart);
	series.setData(generateData());
	chart.timeScale().setVisibleLogicalRange({ from: -500, to: -400 });
}
