function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const series = chart.addLineSeries();
	series.setData(generateData());

	chart.timeScale().fitContent();

	const line = series.createPriceLine({
		price: 10,
		color: 'red',
		lineWidth: 1,
		lineStyle: LightweightCharts.LineStyle.Solid,
		axisLabelVisible: true,
	});

	line.applyOptions({
		price: 20,
		color: '#00FF00',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
		axisLabelVisible: false,
	});
}
