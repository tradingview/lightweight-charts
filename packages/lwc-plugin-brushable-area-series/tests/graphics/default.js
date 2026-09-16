function generateData(count, startIndex) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	time.setUTCDate(time.getUTCDate() + startIndex);
	for (let i = 0; i < count; ++i) {
		const j = i + startIndex;
		res.push({
			time: time.getTime() / 1000,
			value: 60 + Math.sin(j / 9) * 20 + Math.cos(j / 4) * 6,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), {
		priceLineVisible: false,
	});
	series.setData(generateData(80, 0));
	chart.timeScale().fitContent();
}
