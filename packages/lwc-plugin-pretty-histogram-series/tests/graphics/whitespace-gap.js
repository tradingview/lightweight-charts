function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		if (i >= 25 && i < 35) {
			res.push({ time: time.getTime() / 1000 });
		} else {
			res.push({
				time: time.getTime() / 1000,
				value: 10 + Math.abs(Math.sin(i / 6)) * 20,
			});
		}
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	// `histogram` width mode aligns each column against its neighbour; the first
	// column after the gap must not be widened or shifted by that alignment.
	const series = chart.addCustomSeries(new LwcPlugin.PrettyHistogramSeries(), {
		widthMode: 'histogram',
		radius: 3,
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
