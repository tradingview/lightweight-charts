function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		// Totals grow along the series; in percent mode only the shares show.
		const scale = 1 + i / 10;
		res.push({
			time: time.getTime() / 1000,
			values: [
				(10 + Math.sin(i / 8) * 5) * scale,
				(6 + Math.cos(i / 6) * 3) * scale,
				(4 + Math.sin(i / 4) * 2) * scale,
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
		percent: true,
		autoscaleInfoProvider: () => ({
			priceRange: { minValue: 0, maxValue: 100 },
		}),
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
