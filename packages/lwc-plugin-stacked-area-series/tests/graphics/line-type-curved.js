function generateData(count) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < (count || 60); ++i) {
		res.push({
			time: time.getTime() / 1000,
			values: [
				10 + Math.sin(i / 8) * 5,
				6 + Math.cos(i / 6) * 3,
				4 + Math.sin(i / 4) * 2,
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
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries(), {
		lineType: 'curved',
	});
	series.setData(generateData(30));
	chart.timeScale().fitContent();
}
