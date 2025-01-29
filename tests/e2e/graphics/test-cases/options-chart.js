function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createOptionsChart(
		container,
		{ layout: { attributionLogo: false }, localization: { precision: 1 } }
	));

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, { color: 'blue' });

	const data = [];
	for (let i = 0; i < 1000; i++) {
		data.push({
			time: i * 0.25,
			value: Math.sin(i / 100) + i / 500,
		});
	}

	lineSeries.setData(data);

	chart.timeScale().fitContent();
}
