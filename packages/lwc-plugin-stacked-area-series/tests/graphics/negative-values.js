function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			values: [
				5 + Math.sin(i / 8) * 4,
				-3 + Math.cos(i / 6) * 2,
				-6 - Math.sin(i / 5) * 2,
			],
		});
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
