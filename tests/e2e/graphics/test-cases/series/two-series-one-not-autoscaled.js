function generateData(amplitude) {
	const res = [];
	amplitude = amplitude || 30;
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 + amplitude * Math.sin(Math.PI * i / 50),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			scaleMargins: {
				bottom: 0,
				top: 0,
			},
		},
	});

	const mainSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#0000ff',
	});

	mainSeries.setData(generateData(20));

	const secondSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#ff0000',
		autoscaleInfoProvider: () => null,
	});

	secondSeries.setData(generateData());
}
