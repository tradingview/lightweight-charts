function generateData(offset) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: Math.cos(i + offset),
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
			textColor: 'blue',
		},
		rightPriceScale: {
			visible: true,
			textColor: 'red',
		},
	});

	const series1 = chart.addLineSeries({ color: 'red', priceScaleId: 'right' });
	const series2 = chart.addLineSeries({ color: 'blue', priceScaleId: 'left' });

	series1.setData(generateData(0));
	series2.setData(generateData(Math.PI));
}
