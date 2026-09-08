function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		if (i >= 25 && i < 35) {
			res.push({ time: time.getTime() / 1000 });
		} else {
			res.push({
				time: time.getTime() / 1000,
				values: [
					10 + Math.sin(i / 8) * 5,
					6 + Math.cos(i / 6) * 3,
					4 + Math.sin(i / 4) * 2,
				],
			});
		}
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
	}));
	// The opposite of the whitespace-gap case: the bands are drawn straight
	// across the gap instead of stopping at it.
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries(), {
		gapHandling: 'bridge',
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
