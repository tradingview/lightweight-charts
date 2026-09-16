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
	// Per-band line width, line style and visibility, and a band which is
	// drawn as a line only.
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries(), {
		colors: [
			{ line: 'rgb(41, 98, 255)', area: 'rgba(41, 98, 255, 0.3)', lineWidth: 4 },
			{
				line: 'rgb(225, 87, 90)',
				area: 'rgba(225, 87, 90, 0.3)',
				lineStyle: LightweightCharts.LineStyle.Dashed,
			},
			{ line: 'rgb(27, 156, 133)', area: 'rgba(0, 0, 0, 0)', areaVisible: false },
		],
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
