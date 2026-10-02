function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		// The number of values changes along the series: the shorter points
		// are padded, so their top bands collapse onto the one below.
		const values = [10 + Math.sin(i / 8) * 5, 6 + Math.cos(i / 6) * 3];
		if (i < 20 || i >= 40) {
			values.push(4 + Math.sin(i / 4) * 2);
		}
		if (i >= 45) {
			values.push(3 + Math.cos(i / 3));
		}
		res.push({ time: time.getTime() / 1000, values });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries());
	series.setData(generateData());
	chart.timeScale().fitContent();
}
