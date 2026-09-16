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
	// A vertical gradient across each band.
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries(), {
		colors: [
			{
				line: 'rgb(41, 98, 255)',
				area: 'rgba(41, 98, 255, 0.6)',
				areaBottom: 'rgba(41, 98, 255, 0.05)',
			},
			{
				line: 'rgb(225, 87, 90)',
				area: 'rgba(225, 87, 90, 0.6)',
				areaBottom: 'rgba(225, 87, 90, 0.05)',
			},
			{
				line: 'rgb(242, 142, 44)',
				area: 'rgba(242, 142, 44, 0.6)',
				areaBottom: 'rgba(242, 142, 44, 0.05)',
			},
		],
	});
	series.setData(generateData());
	chart.timeScale().fitContent();
}
